import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Local Supabase Storage / API runs at http://127.0.0.1:54321. We allow it
// in CSP only in dev, otherwise the prod browser console exposes a localhost
// origin that has no business being there.
const localSupabase = isDev ? " http://127.0.0.1:54321" : "";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // camera allowed for the admin QR scanner; everything else off
    value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https:${localSupabase}`,
      `media-src 'self' blob: https://*.supabase.co${localSupabase}`,
      "font-src 'self' data:",
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co${localSupabase}`,
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

// 308 (permanent) redirects from the legacy WordPress URL structure to
// the new sitemap. Sponsor sites, calendar apps, printed flyers, and
// search-engine results still link to the old paths; without these
// they'd 404 after the DNS cutover. Each old URL gets two entries —
// with and without trailing slash — because the WordPress site
// historically served both.
const LEGACY_REDIRECTS = [
  ["/registration", "/classes/register"],
  ["/about-tai-chi", "/about"],
  ["/about-tai-chi/why-tai-chi", "/about/why"],
  ["/about-us", "/about"],
  ["/about-us/members", "/about/instructors"],
  ["/about-us/contact", "/contact"],
  ["/about-us/testimonial", "/about#testimonials"],
  ["/mission", "/about"],
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 blocks dev-resource requests from any origin other than the
  // one it bound to. We bind to localhost but tend to hit 127.0.0.1 (and
  // sometimes the LAN IP for phone testing) — whitelist them so HMR,
  // RSC payloads, and dev fonts load. Production is unaffected.
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.16.123"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return LEGACY_REDIRECTS.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      { source: `${source}/`, destination, permanent: true },
    ]);
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "woodlandstaichi.com" },
      // Local Supabase Storage
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
      // Cloud Supabase Storage (any project ref under supabase.co)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Next 16 added an SSRF guard that refuses to proxy any image whose
    // host resolves to a private/loopback IP. Local Supabase Storage runs
    // on 127.0.0.1, which trips this. Production Supabase URLs resolve to
    // public IPs so this flag is a dev-only concession.
    // Ref: node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
