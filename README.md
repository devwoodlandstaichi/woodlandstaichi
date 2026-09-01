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

## Handover

A school-owned email `dev@woodlandstaichi.com` has been created for this purpose. All infrastructure accounts should be created under that address so the school owns everything outright — no transfers between personal accounts needed.

### Service ownership target state

| Service | What it does | Target account | Action needed |
|---|---|---|---|
| **GitHub** | Source code + deployment trigger | `dev@woodlandstaichi.com` | Create school GitHub org → original developer transfers repo |
| **Vercel** | Hosts the website, runs Next.js | `dev@woodlandstaichi.com` | Create Vercel account → connect to school's GitHub org |
| **Supabase** | Database, Auth, Storage, pg_cron | `dev@woodlandstaichi.com` | Create Supabase org → original developer transfers project (Settings → General → Transfer) |
| **Resend** | Transactional email | `dev@woodlandstaichi.com` | Create Resend account → verify woodlandstaichi.com sender domain |
| **Hostinger** (woodlandstaichi.com domain) | DNS | Sesco (founder) | No change — Sesco already owns this |

### Critical: QR_TOKEN_SECRET

`QR_TOKEN_SECRET` signs every member's QR attendance token. If it changes, **all existing QR codes stop working** and every member needs a new one re-emailed.

- Copy the current value from Vercel → Project → Settings → Environment Variables **before doing anything**.
- Paste the same value into the new Vercel project's env vars at the end.
- Do not regenerate it unless you intentionally want to invalidate all member QR codes.

### Setup order

Do it in this order to minimize downtime:

1. **Supabase** — create org under `dev@woodlandstaichi.com`; original developer transfers the existing project. Database, member records, and connection strings stay intact.
2. **Resend** — create account under `dev@woodlandstaichi.com`; verify the woodlandstaichi.com sender domain (adds SPF/DKIM records in Hostinger — ~10 min). Generate a new API key.
3. **GitHub** — create school org under `dev@woodlandstaichi.com`; original developer transfers the repo.
4. **Vercel** — create account under `dev@woodlandstaichi.com`; import project from school's GitHub org; paste all env vars (see "Deployment" section above), using the preserved `QR_TOKEN_SECRET` and the new Resend API key.
5. **Hostinger** — update DNS A/CNAME records to Vercel's values; add Resend's SPF/DKIM/DMARC records for email authentication.

### Adding a new admin user (production)

1. Have the person sign up at https://woodlandstaichi.vercel.app/login
2. Go to Supabase dashboard → Table editor → `user_roles`
3. Insert: `{ user_id: <their auth.users id>, role: 'admin' }`
4. They'll see the admin sidebar on next login.

---

## Need help?
