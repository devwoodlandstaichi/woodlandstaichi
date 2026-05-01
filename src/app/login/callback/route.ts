import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/dal";

// Magic-link callback. The email's confirmation URL points here with
// a ?code=... PKCE token (the @supabase/ssr client defaults to PKCE).
// We exchange it for a session, auto-link the auth user to the
// matching members row by email (mirrors verifyCode), then redirect
// by role.
//
// PKCE caveat: the code verifier is stored in a cookie set when
// signInWithOtp ran, so the link must be clicked in the same browser
// that started the sign-in. If the user opens the email on a
// different device the exchange will fail and we redirect them back
// to /login with an error, where they can fall back to typing the
// 6-digit OTP from the same email body.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "";
  const errDesc =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (errDesc) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errDesc)}`, url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Link expired — request a new one or type the code from your email.")}`,
        url.origin,
      ),
    );
  }

  // Auto-link auth.users → public.members by email so /members/me
  // works on first visit. Same shape as verifyCode in actions.ts.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("members")
      .select("id, user_id")
      .eq("email", user.email)
      .maybeSingle();
    if (row && !row.user_id) {
      await admin.from("members").update({ user_id: user.id }).eq("id", row.id);
    }
  }

  // Role-aware redirect. Honour `next` if it's an internal path the
  // user can access; otherwise default by role.
  const session = await getSessionUser();
  const isStaff = session?.role === "admin" || session?.role === "instructor";
  let target = isStaff ? "/admin" : "/members/me";
  if (next.startsWith("/admin") && isStaff) target = next;
  else if (next.startsWith("/members")) target = next;

  return NextResponse.redirect(new URL(target, url.origin));
}
