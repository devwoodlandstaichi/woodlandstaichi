# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack pin: read the local docs first

This project runs **Next.js 16 + React 19 + Tailwind v4** — APIs and conventions diverge from older training data (App Router defaults, async `cookies()`/`headers()`, Tailwind v4 CSS-first config, Turbopack). Before writing or modifying Next.js / React / Tailwind code, consult `node_modules/next/dist/docs/` for the version actually installed. Heed deprecation notices in build output.

## Commands

```bash
npm run dev:all      # Supabase (Docker) + Next.js dev server together
npm run dev          # Next.js only (assumes Supabase already running)
npm run db:start     # supabase start
npm run db:stop      # supabase stop
npm run db:reset     # reset local DB + re-run migrations + seed.sql
npm run db:status    # print local Supabase URLs/keys
npm run build        # production build
npm run lint         # eslint (flat config in eslint.config.mjs)
```

Local services after `db:start`: API `http://127.0.0.1:54321`, Studio `:54323`, Inbucket mail catcher `:54324`. Analytics container is intentionally **disabled** in `supabase/config.toml` because it doesn't run on Colima — leave it off unless re-enabling for production.

There is no test runner wired up yet.

## Architecture

### Phased build (drives current scope)
The current commit is the Phase 1 scaffold (visual revamp + accessibility shell), but the **schema is already designed for phases 2–4**. Don't hardcode class schedules into pages — classes, sessions, registrations, and attendance are all DB-driven from day one. Admin will live at `/admin/*` in this same Next.js app under role-based auth, not a separate codebase. See `supabase/migrations/20260427000000_initial_schema.sql` for the full data model.

### Supabase client trio (`src/lib/supabase/`)
Three distinct clients — pick the right one:
- `client.ts` → `createClient()` — browser components, anon key, RLS applies.
- `server.ts` → `createClient()` — **async**, server components / route handlers, wires Next's `cookies()` for session refresh. Always `await` it.
- `admin.ts` → `createAdminClient()` — service-role key, **server-only**. Never import from a client component or you'll leak the key.

### RLS is deny-by-default
Every table in the initial migration has RLS enabled with explicit `select`/`all` policies. The `public.is_admin_or_instructor(uid)` SECURITY DEFINER function is the single source of truth for staff access. When adding tables, follow the same pattern: `enable row level security` + explicit policies + index on filter columns. Members can read their own row (`auth.uid() = user_id`) and their own attendance; staff manage everything else.

### QR attendance design constraint (Phase 3)
Tokens stored in `members.qr_token` are opaque IDs; signing/verification happens in app code with `QR_TOKEN_SECRET` (HMAC via `jose`). Camera scanning uses `@zxing/browser` against `getUserMedia` — requires HTTPS in production (Cloudflare Pages provides it). The `Permissions-Policy` header in `next.config.ts` already grants `camera=(self)`; do not widen it.

### Security headers + CSP
`next.config.ts` sets HSTS, frame/content-type, Referrer-Policy, Permissions-Policy, and a strict CSP. `connect-src` whitelists the local Supabase origin and `*.supabase.co` — when adding a new external origin (e.g. Resend, Turnstile, image CDN), update both CSP and `images.remotePatterns`.

### Accessibility baseline (older audience)
Targets WCAG AA. Base font 18px, generous line-height, high-contrast focus rings, semantic HTML, skip-to-content link in `src/app/layout.tsx`, `prefers-reduced-motion` honored throughout, 48×48px minimum tap targets. A user-controlled font scaler component lives at `src/components/font-scaler.tsx`. Don't regress these defaults when adding pages.

### shadcn/ui conventions
`components.json` is configured: style **new-york**, base color **stone**, RSC on, icons from **lucide-react**, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`. Use `cn()` from `@/lib/utils` for class merging. Fonts: `Fraunces` (display, var `--font-fraunces`) and `DM Sans` (body, var `--font-dm-sans`) loaded in `src/app/layout.tsx`.
