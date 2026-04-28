import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
      // Local Supabase Storage serves over http://127.0.0.1:54321 — without
      // an explicit allow-listed entry the CSP `img-src https:` clause
      // blocks it. Production URLs are https://*.supabase.co so they match
      // the https: keyword.
      "img-src 'self' data: blob: https: http://127.0.0.1:54321",
      "media-src 'self' blob: http://127.0.0.1:54321 https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' http://127.0.0.1:54321 https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 blocks dev-resource requests from any origin other than the
  // one it bound to. We bind to localhost but tend to hit 127.0.0.1 (and
  // sometimes the LAN IP for phone testing) — whitelist them so HMR,
  // RSC payloads, and dev fonts load. Production is unaffected.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.16.123",
  ],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
