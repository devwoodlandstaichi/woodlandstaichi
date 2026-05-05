import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16 renamed Middleware → Proxy. Same convention: a single
// proxy.ts at the src/ (or project) root, exporting `proxy` (or default).
// We use it to:
//   1. Rewrite top-level navigations from too-old browsers to /legacy
//      (Tailwind v4 needs Safari 16.4+ / Chrome 111+ for @property).
//   2. Refresh the Supabase session cookie on every navigation so server
//      components see a fresh token (single-use refresh tokens).
//   3. Optimistic redirect for unauthenticated visitors hitting /admin/*.
//      The real authorization check happens in the admin layout against
//      the database (user_roles), not here.

const MIN_SAFARI = 16; // 16.4+ for @property; we round down to whole-major
const MIN_CHROME = 111;
const MIN_FIREFOX = 128;
const MIN_EDGE = 111;

function isOldBrowser(ua: string): boolean {
  if (!ua) return false;

  // Edge ships its version as "Edg/<n>" in addition to a Chrome token.
  // Check Edge first because every Edg UA also matches Chrome.
  const edge = /Edg\/(\d+)/.exec(ua);
  if (edge) return Number(edge[1]) < MIN_EDGE;

  const ff = /Firefox\/(\d+)/.exec(ua);
  if (ff) return Number(ff[1]) < MIN_FIREFOX;

  const chrome = /Chrome\/(\d+)/.exec(ua);
  if (chrome) return Number(chrome[1]) < MIN_CHROME;

  // Safari reports "Version/<n>" alongside an AppleWebKit token; bare
  // AppleWebKit-only UAs (no Version) are weird crawlers — pass through.
  if (/AppleWebKit/.test(ua) && !/Chrome\/|Edg\//.test(ua)) {
    const v = /Version\/(\d+)/.exec(ua);
    if (v) return Number(v[1]) < MIN_SAFARI;
  }

  if (/MSIE \d|Trident\//.test(ua)) return true;

  return false;
}

function shouldServeLegacy(request: NextRequest): boolean {
  // Override: ?fullsite=1 sets a cookie that disables the rewrite.
  if (request.nextUrl.searchParams.get("fullsite") === "1") return false;
  if (request.cookies.get("fullsite")?.value === "1") return false;

  // Only act on top-level HTML document requests. RSC fetches send
  // RSC: 1 / Next-Url headers; Accept must include text/html on the
  // initial navigation.
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) return false;
  if (request.headers.get("rsc")) return false;
  if (request.headers.get("next-router-state-tree")) return false;

  if (request.nextUrl.pathname.startsWith("/legacy")) return false;

  return isOldBrowser(request.headers.get("user-agent") ?? "");
}

export async function proxy(request: NextRequest) {
  // Step 1: legacy-browser rewrite. We do this first so we don't waste a
  // Supabase auth round-trip on a browser that won't render the site.
  if (shouldServeLegacy(request)) {
    return NextResponse.rewrite(new URL("/legacy", request.nextUrl));
  }

  // Drop the override cookie if requested via ?fullsite=1, then continue.
  const response = NextResponse.next({ request });
  if (request.nextUrl.searchParams.get("fullsite") === "1") {
    response.cookies.set("fullsite", "1", {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() forces token refresh + verifies against the Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and static files; run on everything else
    // (cheap — most calls just refresh the cookie).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico|txt)$).*)",
  ],
};
