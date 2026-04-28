# CLAUDE.md

Guidance for Claude Code working in this repository. A new instance should be able to pick up here without re-deriving context.

@AGENTS.md

---

## 1. Project context

**Woodlands Tai Chi** — a non-profit community Tai Chi school in The Woodlands, Texas (Montgomery / Harris County). Founded 2009. ~73 active members. Sponsored by The Woodlands Methodist Church (Adventures in Wellness), Lone Star College System (Academy for Lifelong Learning), and Interfaith of the Woodlands (Senior Activities).

This repo is a ground-up rebuild of <https://woodlandstaichi.com> (currently WordPress). The founder owns the domain and will repoint DNS once the new site is signed off.

**Stakeholders:**
- Tom Gutz — building this; his wife attends classes there.
- The school's founder — ultimate stakeholder, will sign off.
- **Sifu Sesco Saegusa** — chief instructor (referenced throughout testimonials).
- Lineage: **Master George Ling Hu** — practice teachings derive from his writings.

**The real goal isn't aesthetic.** The current WordPress site is dated, but the founder's actual pain point is **attendance tracking** for class rosters. We're rebuilding the public site as a foundation, then layering admin tooling on top. Don't lose sight of this when prioritising.

**Audience characteristics that drive design choices:**
- Skews older — accessibility is non-negotiable, not a nice-to-have.
- Volunteer-led; instructors are not technical — admin UX must be obvious.
- Email/text are how the school communicates. Phone is "not always answered."

---

## 2. Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| **1.0 — Visual revamp** | Palette, layout, accessibility shell, public home page | ✅ Done (commit `9b6a5fc`) |
| **1.1 — Content migration** | Migrate WordPress content to dedicated Next.js routes | 🟡 In progress: `/about` done (`f07c4d0`); `/classes`, `/world-tai-chi-day`, `/gallery`, `/store`, `/news` pending |
| **1.2 — Registration form** | Replace JotForm; write directly to `members` + `registrations` tables; Cloudflare Turnstile | ⏳ Designed, not built |
| **2.0 — Class management** | Admin can CRUD classes/sessions; member roster view; Supabase Auth integration | ⏳ Schema ready (`classes`, `class_sessions`, `user_roles`); UI not built |
| **3.0 — QR attendance** | Per-member HMAC-signed QR tokens emailed via Resend; webcam scanner at `/admin/attendance/scan`; manual name-search backup; idempotent attendance writes | ⏳ Designed (DB + crypto deps installed); UI/API not built |
| **3.1 — Reminders** | `pg_cron` scheduled jobs (dues, class reminders) → Supabase Edge Function → Resend | ⏳ Designed |
| **4.0 — Admin dashboard** | Polish admin into a dedicated section under `/admin/*` with full role-based UI | ⏳ Future |

**Critical principle:** the schema is already designed for phases 2–4. **Don't hardcode class schedules** into pages — render from Supabase. The home page's `ScheduleSection` and `/about` `TestimonialsSection` are templates for this pattern.

---

## 3. Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **React 19**
- **Tailwind CSS v4** (CSS-first config in `globals.css`, no `tailwind.config`)
- **shadcn/ui** (style: `new-york`, base: `stone`, icons: `lucide-react`)
- **Supabase** (Postgres + Auth + Storage + `pg_cron` + Edge Functions)
- **Cloudflare Pages** (target host — free tier, no commercial restriction)
- **Resend** (transactional email — Phase 3+)
- **Colima** (local Docker runtime — Docker Desktop not used; user preference for free + CLI-only)

**Stack pin: read the local docs first.** Next.js 16 + React 19 + Tailwind v4 diverge from older training data (App Router defaults, async `cookies()`/`headers()`, Tailwind v4 CSS-first config, Turbopack). Before modifying Next/React/Tailwind code, consult `node_modules/next/dist/docs/` for the actually-installed version. Heed deprecation notices in build output.

**Why this stack (for a future Claude that might want to reconsider):** Cloudflare Pages over Vercel because Vercel Hobby's commercial restriction is gray-area for a non-profit. Supabase over a custom Express+Postgres stack because we get RLS, Auth, pg_cron, and Studio for free with no extra services. **Everything must remain free-tier** — this is a non-profit; don't suggest paid services without explicit permission.

---

## 4. Commands

```bash
npm run dev:all      # Supabase (Docker) + Next.js dev server together
npm run dev          # Next.js only (assumes Supabase already running)
npm run db:start     # supabase start
npm run db:stop      # supabase stop
npm run db:reset     # reset local DB + re-run migrations + seed.sql
npm run db:status    # print local Supabase URLs/keys
npm run build        # production build (Turbopack)
npm run lint         # ESLint (flat config in eslint.config.mjs)
```

Local services after `db:start`: API `:54321`, Studio `:54323`, Inbucket (mail catcher) `:54324`, Postgres `:54322`.

**Colima quirk:** Supabase analytics (Vector + Logflare) won't run on Colima — it tries to mount the docker socket at a path Colima doesn't expose. We've **disabled analytics** in `supabase/config.toml`. Leave it off for local dev. Re-enable if/when production needs it.

No test runner wired up yet.

---

## 5. Architecture

### Supabase client trio (`src/lib/supabase/`)

Three distinct clients — pick the right one:

- **`client.ts`** → `createClient()` — browser components, anon key, RLS applies.
- **`server.ts`** → `createClient()` — **async**, server components / route handlers, wires Next's `cookies()` for session refresh. Always `await` it.
- **`admin.ts`** → `createAdminClient()` — service-role key, **server-only**. Never import from a client component or you leak the key.

### RLS is deny-by-default

Every table has RLS enabled with explicit `select`/`all` policies. The `public.is_admin_or_instructor(uid)` SECURITY DEFINER function is the single source of truth for staff access.

**When adding tables, follow this pattern exactly:**
1. Create table with required indexes
2. Add `updated_at` trigger if mutable
3. `alter table ... enable row level security`
4. Public-readable data → `create policy "anyone reads ..." for select using (active = true)` (or similar predicate)
5. Staff manage → `create policy "admins manage ..." for all using (public.is_admin_or_instructor(auth.uid())) with check (...)`
6. Member self-access (if relevant) → policy keyed off `auth.uid() = user_id`

See `supabase/migrations/20260427000100_testimonials.sql` as a minimal reference.

### Database tables (current state)

- **`members`** — registration data, level enum (`instructor`/`beginners`/`intermediate`/`advanced`), waiver fields, **`qr_token`** (Phase 3, opaque + HMAC-signed in app), optional `user_id` link to `auth.users`.
- **`user_roles`** — `admin`/`instructor`/`member`. Drives `is_admin_or_instructor()`.
- **`classes`** — recurring class definitions (location, day, time, level, capacity). Public-readable when `active = true`.
- **`class_sessions`** — specific occurrences on a date. Staff-only.
- **`registrations`** — member↔class enrollments + payment status. Unique `(member_id, class_id)`.
- **`attendance`** — Phase 3. Unique `(member_id, class_session_id)` for idempotent re-scans. Method enum `qr|manual`.
- **`testimonials`** — quotes from members, public-readable.

### QR attendance design constraint (Phase 3)

Tokens stored in `members.qr_token` are opaque IDs; signing/verification happens in app code with `QR_TOKEN_SECRET` (HMAC via `jose`). Camera scanning uses `@zxing/browser` against `getUserMedia` — requires HTTPS in production (Cloudflare Pages provides it). The `Permissions-Policy` header in `next.config.ts` already grants `camera=(self)`; do not widen it. Backup flow: type-to-search by name when QR fails.

### Security headers + CSP

`next.config.ts` sets HSTS, frame/content-type, Referrer-Policy, Permissions-Policy (`camera=(self)`), and a strict CSP. `connect-src` whitelists the local Supabase origin and `*.supabase.co` — when adding a new external origin (Resend, Turnstile, image CDN, etc.), update **both** the CSP and `images.remotePatterns`.

### Accessibility baseline (older audience)

WCAG AA target. Don't regress:
- 18px base font (not 16), generous line-height (1.65)
- User-controlled font scaler at `src/components/font-scaler.tsx` — uses `useSyncExternalStore` (proper React 19 pattern, avoids setState-in-effect lint)
- High-contrast focus rings (3px outline + offset)
- Skip-to-content link in `src/app/layout.tsx`
- `prefers-reduced-motion` honored in `globals.css` (kills all animation)
- 44×44px minimum tap targets (44 chosen, 48 was the original aspiration but `min-h-10`/`min-w-10` lands closer to 44)
- Semantic HTML; aria labels on icon-only buttons; aria-pressed for toggles

---

## 6. Design system

### Aesthetic direction (locked)

**Editorial-quiet.** Serif display + clean sans, asymmetric layouts, generous whitespace, single accent color (vermillion), occasional CJK glyph as decorative typography. **NOT** modern-minimal-tech, NOT brutalist, NOT maximalist. Calm and refined to match the practice itself. The crane crest's heritage is honored without kitsch.

### Palette (sampled from the crane crest logo)

All in OKLCH for perceptual uniformity. Defined in `src/app/globals.css`:

- **Ink** scale (warm near-black to parchment) — the dominant neutral
- **Vermillion** — single accent, sampled from the logo's red sun. Use sparingly (one accent per section).
- **Cobalt** — sampled from logo waves. Used in atmospheres, level badges; sparingly.
- **Jade** — feather accents. Reserved for success states / "combined" level.

The body has **two faint radial gradients** (vermillion top-right, cobalt bottom-left) that give warmth without being decorative noise. Don't replace this with flat color.

### Typography

- **Display:** `Fraunces` (variable, optical-sizing on, axes `opsz` + `SOFT`). Used in hero/section headlines, often italicized for the accent line.
- **Body:** `DM Sans`. Set `font-feature-settings` to `ss01, cv11`.
- **Tabular numerics:** `font-mono` (Geist Mono via system fallback) with `tabular-nums` for times in the schedule.

Tailwind exposes `font-display` (Fraunces) and `font-sans` (DM Sans, default).

### CJK glyph accents

Used as decorative typography (large, low-opacity, behind or beside content), never as essential meaning since not all readers will recognize them.
- 靜 (stillness) — hero on home
- 心 / 形 / 氣 (mind / body / breath) — three pillars
- 和 (harmony) — `/about` page header
- 歡 (welcome) — contact section

### Layout idioms

- Section eyebrow pattern: `<short rule><uppercase tracking-[0.45em] text>`
- Two-column splits at 5/7 or 4/8 with `md:pl-8` on the right column for editorial breathing room
- Section headline pattern: 2-line `font-display`, second line italic + vermillion
- Inverted (ink-bg) sections used sparingly for contrast (schedule, lineage)

### Motion

Slow, gentle, deliberate (matches Tai Chi pace):
- `.rise` keyframe: 900ms cubic-bezier — used for hero/headline entrance
- Staggered via inline `animationDelay` (120ms / 240ms / 360ms steps)
- All animation respects `prefers-reduced-motion`

---

## 7. shadcn/ui conventions

`components.json` config: style `new-york`, base color `stone`, RSC on, icons from `lucide-react`. Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`. Use `cn()` from `@/lib/utils` for class merging.

The shadcn CLI `init` command was **interactive and we couldn't pipe through it** — `components.json` was written manually. Adding components via `npx shadcn add <component>` should still work; if it doesn't, copy the component source manually.

---

## 8. Recipes

### Add a new public page

1. Scrape the corresponding old-site URL with WebFetch (or general-purpose Agent for multiple URLs at once) and **preserve verbatim** content.
2. Create `src/app/<slug>/page.tsx` — server component by default. Reuse `<SiteHeader />`, `<SiteFooter />`, `<PageHeader />`.
3. Match the home page's section grammar: eyebrow → display headline → 2-col body → optional ink-bg inverted section.
4. Pull dynamic content from Supabase via `createClient()` in `src/lib/supabase/server.ts`.
5. Add the route to `NAV` in `src/components/site-header.tsx`.
6. Run `npm run lint && npm run build` to confirm.

### Add a new Supabase table

1. New file in `supabase/migrations/<UTC-timestamp>_<name>.sql`. Timestamp format: `YYYYMMDDHHMMSS`.
2. Define table → indexes → `updated_at` trigger if mutable → `enable row level security` → policies (see RLS pattern above).
3. Optionally add seed rows to `supabase/seed.sql`.
4. `npm run db:reset` to apply locally.
5. Use Studio (`:54323`) to confirm rows + policies.

### Migrate a page from the old WordPress site

The old site URL pattern: `https://woodlandstaichi.com/<section>/<slug>/`. The testimonials live at `/about-us/testimonial/` (singular slug, easy to miss). Use the `general-purpose` Agent for multi-page scrapes — passes back markdown with verbatim text. Watch for **truncation** in long content (testimonials especially) — the Agent flags suspect entries.

---

## 9. Content migration status

Source: <https://woodlandstaichi.com>. Tracked here to avoid re-scraping.

| Section | Source | Status | Destination |
|---|---|---|---|
| Mission / About | `/about-tai-chi/`, `/about-us/`, `/about-us/members/`, `/about-us/testimonial/`, `/mission/` | ✅ Migrated | `/about` |
| Why Tai Chi (movement-by-movement benefits) | `/about-tai-chi/why-tai-chi/` | ⚠️ Scraped, **not yet rendered** — full content extracted by general-purpose agent on 2026-04-27, available in conversation history. Either render in `/about` or split into `/about/why` |
| Class schedule | `/classes/` | ✅ DB-seeded; rendered on home + (eventually) `/classes` |
| Class registration / level descriptions | `/classes/` | ❌ Not migrated yet |
| Holiday closures | `/classes/` | ❌ Mentioned in seed comments only — needs UI |
| Testimonials | `/about-us/testimonial/` | 🟡 15 of ~35 seeded; long ones may be **truncated** by WebFetch summarizer — flag for founder review |
| Members roster | `/about-us/members/` | ❌ ~60 current + ~45 newbie + ~350 past — names + photos only, no bios. Decision pending: list, gallery, or skip? |
| World Tai Chi Day events | `/gallery/` | ❌ 8 yearly posters (2019–2026). Annual event central to identity — give it a dedicated `/world-tai-chi-day` page |
| Gallery (practice photos) | `/gallery/` | 🟡 Photos in `public/photos/` (mix of Tom's wife's photos + WTC gallery WebP files) — page not built |
| Store (informational) | `/store/` | ❌ Shirts, jackets, uniforms, fans, shoes |
| News | `/news/` | ❌ Not scraped |
| Links | `/links/` | ❌ Not scraped |
| Contact | `/about-us/contact/` | ✅ Email + text on home + footer |

---

## 10. Open questions for the founder

These need decisions before respective sections can be finalized:

1. **Higher-res logo file?** Currently using a 150×150 PNG pulled from the live site. Looks fuzzy at the hero size. SVG would be ideal.
2. **Hero video:** Tom mentioned slow-motion practice videos as candidates for a hero background. Has not yet shared them (Google Photos share links can't be fetched programmatically — needs direct files).
3. **Members page treatment:** ~400 historical members with photos but no bios. List? Gallery? Skip entirely? Current testimonials section may be a sufficient "human face" of the org.
4. **Sifu Sesco Saegusa bio:** Inferred from testimonials as chief instructor. Old site has no bio page. Worth adding one?
5. **Master George Ling Hu bio:** Currently only attribution + a single quote. Lineage section could be richer with biographical info if available.
6. **Truncated testimonials:** Several long testimonials in `seed.sql` may have been clipped during WebFetch scrape. Founder to verify before publishing.
7. **Domain repointing date:** When does the founder want to cut over `woodlandstaichi.com` to the new site? Drives Phase 1 completion deadline.
8. **Email sender domain:** `info@woodlandstaichi.com` exists. For Resend, we'll need DNS access to add SPF/DKIM/DMARC records before sending mail in Phase 3.
9. **Store: stays informational forever, or eventually transactional?** Drives whether to wire Stripe/Shopify later.
10. **`/about/why` typos** — preserved verbatim from legacy site, three lurking issues need Sifu's call before prod cutover: *"felling if joyfulness"* (Wave Hands Like the Clouds), *"spin supple"* (Strike Both Ears), *"alertness if the cerebrum"* (White Crane Spreads Its Wings). Fix in `src/app/about/why/page.tsx` if he says go.

---

## 11. Repo state quick-reference

```
.
├── src/
│   ├── app/
│   │   ├── about/page.tsx      ← Phase 1.1 ✅
│   │   ├── globals.css         ← palette, fonts, accessibility, motion
│   │   ├── layout.tsx          ← Fraunces + DM Sans, skip link, metadata
│   │   └── page.tsx            ← home (Hero + About teaser + Schedule + Locations + Contact)
│   ├── components/
│   │   ├── about-section.tsx        ← home teaser (3 pillars short form)
│   │   ├── contact-section.tsx
│   │   ├── font-scaler.tsx          ← A/A+/A++ accessibility control
│   │   ├── hero.tsx
│   │   ├── locations-section.tsx
│   │   ├── page-header.tsx          ← reusable for inner pages
│   │   ├── schedule-section.tsx     ← live from Supabase
│   │   ├── site-footer.tsx
│   │   ├── site-header.tsx          ← sticky nav + mobile drawer + font scaler
│   │   └── testimonials-section.tsx ← live from Supabase
│   └── lib/
│       ├── format.ts                ← day/level/time formatters
│       ├── supabase/{client,server,admin}.ts
│       └── utils.ts                 ← cn() for shadcn
├── supabase/
│   ├── config.toml                  ← analytics disabled (Colima quirk)
│   ├── migrations/
│   │   ├── 20260427000000_initial_schema.sql
│   │   └── 20260427000100_testimonials.sql
│   └── seed.sql                     ← 9 classes + 15 testimonials
├── public/
│   ├── logo.png                     ← 150×150, needs higher-res
│   └── photos/                      ← gallery + Tom's wife's photos (jpeg/webp/heic)
├── .env.example                     ← template; .env.local is gitignored
├── next.config.ts                   ← security headers, CSP
└── components.json                  ← shadcn config (manual; CLI was interactive)
```

---

## 12. Working principles for future Claude

- **Don't add features beyond what was asked.** Phase 1.1 is content migration. Don't sneak in Phase 2 UI under the guise of "while I was there." Bug fixes don't need surrounding cleanup.
- **Don't hardcode what should be DB-driven.** Classes, sessions, testimonials, news posts → all Supabase. The founder will eventually edit these via Studio (then admin UI).
- **Preserve the founder's voice.** Migrate content **verbatim** when scraping the old site. Tom and the founder can revise after.
- **Free-tier guardrail.** Never suggest a paid service without explicit user approval. This is a non-profit.
- **Accessibility is not optional.** The audience skews older; visual flourish must never compromise readability or focus visibility.
- **Clarify before destructive action.** The user explicitly worked through `git init` confusion; assume similar care for any irreversible op (force push, db drop, destructive migrations).
- **Match the editorial-quiet aesthetic.** Refined > clever. No purple gradients, no glassmorphism, no neon. The crane crest is the brand anchor.
