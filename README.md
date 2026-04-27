# Woodlands Tai Chi

A new website + member-management system for Woodlands Tai Chi, a community
school in The Woodlands, Texas, teaching in the lineage of Master George Ling Hu.

Replaces the existing WordPress site at <https://woodlandstaichi.com>.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Supabase** (Postgres + Auth + Storage + pg_cron) — local dev via Docker
- **Cloudflare Pages** for hosting (free tier, no commercial restrictions)
- **Resend** for transactional email (Phase 3+)
- All free-tier — this is a non-profit.

## One-time setup

```bash
# 1. Install Node 20+, Docker Desktop, and Supabase CLI
brew install node supabase/tap/supabase
# Install Docker Desktop from docker.com (required for local Supabase)

# 2. Clone + install
git clone https://github.com/tomgutz/woodlandstaichi.git
cd woodlandstaichi
npm install

# 3. Local env vars
cp .env.example .env.local
# After step 4, paste the keys printed by `supabase start` into .env.local
```

## Daily dev — one command

```bash
npm run dev:all
```

This starts:
- **Supabase** (Postgres, Auth, Storage, Studio at <http://127.0.0.1:54323>, mail catcher at <http://127.0.0.1:54324>)
- **Next.js** dev server at <http://127.0.0.1:3000>

The first run will pull Docker images (~2 min). After that, both come up in seconds.

### Other useful scripts

```bash
npm run dev          # Next.js only (if Supabase already running)
npm run db:start     # start Supabase only
npm run db:stop      # stop Supabase
npm run db:reset     # reset local DB + re-run migrations + seeds
npm run db:status    # show local Supabase URLs/keys
npm run build        # production build
npm run lint         # eslint
```

## Project structure

```
.
├── src/
│   ├── app/                     # Next.js App Router pages
│   ├── components/              # Shared UI components
│   └── lib/
│       ├── supabase/            # Supabase clients (browser/server/admin)
│       └── utils.ts             # cn() helper for shadcn
├── supabase/
│   ├── config.toml              # Local Supabase config
│   ├── migrations/              # Schema migrations (versioned)
│   └── seed.sql                 # Seed data for local dev
├── public/
│   └── photos/                  # Class photos (placeholders for now)
└── ...
```

## Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| **1** | Visual revamp — palette, layout, accessibility shell, public pages, registration form | In progress |
| **2** | Admin CRUD for classes, member roster | Designed (DB ready) |
| **3** | QR-code attendance — scan via webcam, email QR via Resend, dues reminders via `pg_cron` | Designed (DB ready) |
| **4** | Dedicated admin dashboard at `/admin/*` (or subdomain) | Future |

## Accessibility

The site targets WCAG AA minimum (AAA where reasonable). Built for an older audience:
- Base font 18px, generous line-height
- User-controlled font scaler (planned: A / A+ / A++ in header)
- High-contrast focus rings, semantic HTML, skip-to-content link
- `prefers-reduced-motion` support throughout
- Mobile-first responsive with 48×48px minimum tap targets

## Security

See `next.config.ts` for HTTP security headers (HSTS, CSP, frame options, etc.).
Database access goes through Supabase Row-Level Security — every table denies
by default and grants explicit access via policies. QR-code tokens are
HMAC-signed (see `QR_TOKEN_SECRET`) so they cannot be forged.

## Contributing

Currently a private/solo build. Founder of Woodlands Tai Chi is the stakeholder.
