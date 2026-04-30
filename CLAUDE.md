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
| **1.0 — Visual revamp** | Palette, layout, accessibility shell, public home page | ✅ Done |
| **1.1 — Content migration** | `/about`, `/about/why`, `/about/instructors`, `/classes`, `/classes/beginners`, `/world-tai-chi-day`, `/gallery`, `/store`, `/news`, `/contact`, `/links` | ✅ Done |
| **1.2 — Registration form** | Replace JotForm; new + returning paths; writes to `members` + `registrations` | ✅ Done (Turnstile still pending) |
| **2.0 — Admin** | Auth, role gating, sidebar, dashboard, full CRUD across classes/sessions/members/instructors/news/testimonials/orders/registrations + filters/search/sort | ✅ Done |
| **3.0 — QR attendance** | Per-member HMAC tokens; bulk-issue + email; `/scan/<id>` webcam scanner; manual name-search; attendance writes | 🟡 In progress (token issuing + scan route exist; manual-search/refinement pending) |
| **3.1 — Reminders** | `pg_cron` → Supabase Edge Function → Resend (dues, class reminders) | ⏳ Designed |
| **4.0 — Store/orders** | Public order form for shirts/uniforms; admin queue + payment status | ✅ Done (still informational — no Stripe) |
| **5.0 — Member portal** | `/members/me` self-service: profile, photo, bio (admin/instructor public bio), QR regen | 🟡 Started (`/members/me` exists) |
| **5.1 — Self-submitted testimonials** | Members submit → admin approval queue → publish to `/about` | ⏳ Designed (see §13) |
| **6.0 — Production cutover** | Cloudflare Pages deploy + hosted Supabase + DNS repoint | ⏳ Pending founder sign-off |

**Critical principle:** the schema is already designed for every shipping phase. **Don't hardcode anything that lives in Supabase** — classes, sessions, testimonials, news, instructors, orders, registrations all flow through the DB. The public `ScheduleSection` (home + `/classes`), `TestimonialsSection` (`/about`), `/news`, `/about/instructors`, and `/classes/register` are reference patterns.

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

- **`members`** — registration data; level enum (`instructor`/`beginners`/`intermediate`/`advanced`); waiver + emergency-contact fields; `bio` + `photo_url` (used by member portal); `qr_token` + `qr_issued_at` + `qr_revoked_at`; optional `user_id` FK to `auth.users`.
- **`user_roles`** — `admin`/`instructor`/`member`. Drives `is_admin_or_instructor()` and `is_admin()` (both `security definer` to avoid RLS recursion — see "Gotchas" below).
- **`classes`** — recurring class definitions (location, day, time, level, capacity). Public-readable when `active = true`.
- **`class_sessions`** — specific occurrences on a date. Staff-only.
- **`registrations`** — member↔class enrollments + payment status. Unique `(member_id, class_id)`.
- **`attendance`** — Phase 3. Unique `(member_id, class_session_id)` for idempotent re-scans. Method enum `qr|manual`.
- **`testimonials`** — quotes from members, public-readable when `active = true`.
- **`news_posts`** — announcements; `cover_image_url` + `cover_image_path` for Storage-backed cover images; public-readable when `published = true`.
- **`instructors`** — separate from members so historical/non-member instructors render. `tier` enum (`founder`/`senior`/`instructor`/`assistant`); `photo_url`; optional `member_id` FK to `members` for active members who also instruct.
- **`orders`** — store orders (shirts, uniforms). `payment_status` enum; line items in `notes` until we move to a real line-item table.
- **`app_settings`** — single-row config (kiosk PIN etc.). Service-role only.

Migrations live under `supabase/migrations/` — 11 of them at last count, named `YYYYMMDDHHMMSS_<thing>.sql`. Always **add forward** (new file), never edit a committed one.

### Storage buckets

- **`news`** — public-read, staff-write. Cover images.
- **`instructor-photos`** — public-read, staff-write. Instructor portraits.

Bucket creation + RLS lives inside the migration that introduces the feature (see `20260428000100_news_cover_image.sql` and `20260428100100_instructor_photos.sql` for the pattern).

### QR attendance design constraint (Phase 3)

Tokens stored in `members.qr_token` are opaque IDs; signing/verification happens in app code with `QR_TOKEN_SECRET` (HMAC via `jose`). Camera scanning uses `@zxing/browser` against `getUserMedia` — requires HTTPS in production (Cloudflare Pages provides it). The `Permissions-Policy` header in `next.config.ts` already grants `camera=(self)`; do not widen it. Backup flow: type-to-search by name when QR fails.

### Security headers + CSP

`next.config.ts` sets HSTS, frame/content-type, Referrer-Policy, Permissions-Policy (`camera=(self)`), and a strict CSP. `connect-src` whitelists the local Supabase origin and `*.supabase.co`. **`img-src` and `media-src` also whitelist `http://127.0.0.1:54321`** — without it, the browser blocks every image served from the local Storage buckets. When adding a new external origin (Resend, Turnstile, image CDN, etc.), update **both** the CSP and `images.remotePatterns`.

**Next 16 SSRF guard:** `images.dangerouslyAllowLocalIP = process.env.NODE_ENV !== "production"`. Without it, `next/image` refuses to optimize images whose host resolves to a private IP (loopback, RFC1918), so local Supabase Storage URLs error out as `upstream image resolved to private ip`. Production Supabase URLs resolve to public IPs so the flag stays off there.

### Auth email via Resend SMTP

Supabase Auth (GoTrue) sends password-reset OTPs, magic links, etc. through SMTP. We point GoTrue at **Resend** in `supabase/config.toml` under `[auth.email.smtp]` with `pass = "env(RESEND_API_KEY)"`. The `npm run db:start` / `db:reset` scripts source `.env.local` so the env var is in scope when `supabase start` runs (`set -a; . ./.env.local; set +a; supabase start`). Without that source step, `env(RESEND_API_KEY)` resolves to empty and SMTP silently fails.

Locally with this config, mail goes through real Resend — Inbucket no longer catches auth emails. To swap back to Inbucket for local dev, comment out the SMTP block in `config.toml` and `npm run db:stop && npm run db:start`.

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

### Add a new admin route with the standard table affordances

Every admin list page follows the same shape — copy from `/admin/members` or `/admin/news`:

1. **Server component** under `src/app/admin/<thing>/page.tsx`. Read `q`, `status`, `sort`, `dir`, etc. from `searchParams`.
2. **Filter strip** — `<thing>/filters.tsx`, `"use client"`. Sticky-positioned (`top-16`), single row of `flex flex-wrap items-center gap-3` with the search input + pills + Reset. **Always use `window.location.href = url.toString()` to navigate** — not `router.push` / `router.replace`. The hard-nav pattern is the bulletproof one (see "Gotchas").
3. **Search query** — PostgREST `.or("col.ilike.*safe*,...")` with **`*` as the wildcard, not `%`** (the inline `or=()` URL syntax differs from `.ilike()`'s call form). Strip `,()*` from user input first.
4. **Sortable columns** — declare `SORT_COLUMNS` allow-list, type-guard `params.sort`/`params.dir`, build `<a>` tags via a `sortHref()` helper. The clicked column toggles asc↔desc; clicking another column starts asc.
5. **Filters** apply via `.eq()` for enums; sort is the trailing `.order()`.
6. **Mutation actions** in `<thing>/actions.ts` — `"use server"`. Always `await requireStaff()` (or `requireAdmin()` for admin-only). On success: `revalidatePath("/admin/<thing>")` + the public path if it surfaces there, then `redirect()`.

### Form actions with validation errors (React 19 footgun)

When a server action returns `{ status: "error", values: {...} }`, React 19 **resets the form's uncontrolled inputs**. `defaultValue` only re-applies on mount, so simply re-rendering won't restore typed values. Two pieces are needed:

1. **Snapshot every value** in the action via a `snapshotValues(formData)` helper, returning `Record<string, string>` for all string entries.
2. **Re-key the form** on every error transition so React remounts the inputs with the new defaults. Use the render-time setState pattern (no `useEffect`):
   ```tsx
   const [submitCount, setSubmitCount] = useState(0);
   const [lastState, setLastState] = useState(state);
   if (state !== lastState) {
     setLastState(state);
     if (state.status === "error") setSubmitCount((c) => c + 1);
   }
   <form key={`s-${submitCount}`} action={formAction}>...</form>
   ```

Reference: `src/app/classes/register/registration-form.tsx`. Same pattern in the returning form.

### Image upload to a Storage bucket

See `src/app/admin/news/actions.ts` → `resolveCoverChange()`. Pattern:

1. Form sends a `File` field plus an optional `remove_X=1` flag.
2. Action validates MIME + size, then uses **the service-role admin client** (`createAdminClient()`) for the upload — bypasses storage RLS so the action's existing `requireStaff()` gate is the only auth check.
3. Path: `<crypto.randomUUID()>.<ext>` inside the bucket. Persist BOTH `<thing>_url` (for rendering) and `<thing>_path` (for cleanup on replace/delete).
4. On replace: upload new → if success, `remove([oldPath])`. On clear: `remove([oldPath])` and null out both columns.
5. On row delete: select the path before delete, then `remove([oldPath])` after.

### Migrate a page from the old WordPress site

The old site URL pattern: `https://woodlandstaichi.com/<section>/<slug>/`. The testimonials live at `/about-us/testimonial/` (singular slug, easy to miss). Use the `general-purpose` Agent for multi-page scrapes — passes back markdown with verbatim text. Watch for **truncation** in long content (testimonials especially) — the Agent flags suspect entries.

---

## 8a. Gotchas we hit and the fixes

These are real bugs we worked through. If you see one of these symptoms, jump straight to the fix.

- **`infinite recursion detected in policy for relation "user_roles"`** — caused by an `admins manage roles` policy with an inline `exists (select … from user_roles …)` subquery. The subquery is itself subject to RLS, which re-invokes the same policy. Fix: move the admin check into a `security definer` function (`public.is_admin(uid)`). Migration `20260427000300_fix_user_roles_recursion.sql` is the working reference.
- **`Expected 3 parts in JWT; got 4`** — `.env.local` still has the placeholder (`eyJ...REPLACE_WITH_LOCAL_ANON_KEY`); the literal `...` is what the JWT decoder counts as a 4th part. Fix: paste real keys from `supabase status -o env`.
- **Image returns 200 in curl but doesn't render in the browser** — CSP `img-src` doesn't list `http://127.0.0.1:54321`. See "Security headers + CSP" above.
- **`upstream image resolved to private ip ["127.0.0.1"]`** — Next 16 SSRF guard. Fix: `images.dangerouslyAllowLocalIP` (dev-only).
- **PostgREST `.or("name.ilike.%foo%,...")` returns nothing** — inside `.or()`, the wildcard is `*`, not `%`. The `.ilike()` call form translates `%` for you; the inline filter string does not.
- **Filters don't update the table when typing** — caused by `router.push`/`router.replace` not retriggering RSC fetch on search-param-only changes in some Next 16 paths. Fix: hard-nav via `window.location.href = url.toString()`. Used everywhere now for consistency.
- **`<Link><Button>` doesn't navigate** — invalid HTML (button inside anchor); the inner button swallows the click. Fix: use `<Link className="…button-styles">` with no inner button, or render an unstyled `<button type="button" onClick={…}>` sibling.
- **Form fields wipe on validation error** — React 19 resets uncontrolled inputs after a form action. Fix: re-key the form on each error transition. See "Form actions with validation errors" recipe.
- **`set-state-in-effect` lint** — the React 19 lint rule pushes you toward render-time setState ("derive from external value") for cases like syncing local input state to a URL prop. Inline:
  ```tsx
  const [text, setText] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) { setLastQ(q); setText(q); }
  ```
  Reserve `useEffect`-with-disable-comment only for things that can't run during render (localStorage hydration, listeners).
- **`supabase status` env keys not picked up by config.toml `env(...)`** — Supabase CLI reads OS env at start time. The npm scripts `set -a; . ./.env.local` so `RESEND_API_KEY` etc. are exported before the CLI runs.

---

## 9. Content migration status

Source: <https://woodlandstaichi.com>. Tracked here to avoid re-scraping.

| Section | Source | Destination | Status |
|---|---|---|---|
| Mission / About | `/about-tai-chi/`, `/about-us/`, `/mission/` | `/about` | ✅ |
| Why Tai Chi (movement-by-movement benefits) | `/about-tai-chi/why-tai-chi/` | `/about/why` | ✅ |
| Instructors | `/about-us/members/` (instructors only) | `/about/instructors` | ✅ DB-driven via `instructors` table + photo upload |
| Class schedule | `/classes/` | home `ScheduleSection` + `/classes` | ✅ |
| Beginner-cohort details + holiday closures | `/classes/` | `/classes/beginners` | ✅ |
| Class registration | (replaces JotForm) | `/classes/register` (new + `?mode=returning`) | ✅ |
| Testimonials | `/about-us/testimonial/` | `/about` (lower section) | 🟡 15 of ~35 in seed; long ones may be truncated by WebFetch — founder to review before prod |
| Members roster (historical) | `/about-us/members/` | — | ⏳ Decision pending: list / gallery / skip |
| World Tai Chi Day events | `/gallery/` | `/world-tai-chi-day` | ✅ |
| Gallery | `/gallery/` | `/gallery` | ✅ |
| Store (informational) | `/store/` | `/store` + `/store/order` | ✅ (no Stripe) |
| News | `/news/` | `/news` (DB-driven) | ✅ |
| Links | `/links/` | `/links` | ✅ |
| Contact | `/about-us/contact/` | `/contact` + form | ✅ |
| Member portal | (new) | `/members/me` | 🟡 Started |

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

## 11. Repo orientation

The codebase has grown past the point where a static tree in this file stays accurate. Use `ls`/`find`/`tree`. Quick orientation:

- **Public routes** under `src/app/` mirror the URL: `/about`, `/about/why`, `/about/instructors`, `/classes`, `/classes/beginners`, `/classes/register` (+ `/thanks`), `/contact`, `/gallery`, `/links`, `/login` (+ `/forgot`, `/verify`), `/members/me`, `/news`, `/scan/[id]` (Phase 3 QR landing), `/store` (+ `/order` + `/order/thanks`), `/world-tai-chi-day`.
- **Admin routes** under `src/app/admin/`: `attendance`, `classes`, `instructors`, `members`, `news`, `orders`, `registrations`, `sessions`, `settings/kiosk`, `testimonials`, `users`. Each has the same shape: `page.tsx` (list) + `filters.tsx` (sticky filter strip) + `actions.ts` (server actions) + `[id]/edit/page.tsx` (form) where applicable.
- **Layout pieces:** `src/app/admin/layout.tsx` is the single-scroll-context shell. `src/components/admin/sidebar.tsx` is the collapsible branded sidebar. `src/components/admin/nav.tsx` is the grouped nav definition.
- **Shared site chrome:** `src/components/site-header.tsx`, `site-footer.tsx`, `page-header.tsx`, `font-scaler.tsx`. Section blocks are in `*-section.tsx` (about, contact, hero, locations, schedule, testimonials).
- **Form primitives:** `src/components/form-fields.tsx` (Field, Textarea, Select, RadioGroup, Checkbox, FormSection) — used by the public registration forms. Admin uses a separate primitives file: `src/components/admin/ui.tsx`.
- **Supabase clients:** `src/lib/supabase/{client,server,admin}.ts` — pick by use case (see §5).
- **DB:** `supabase/migrations/*.sql` (numbered), `supabase/config.toml`, `supabase/seed.sql`, `supabase/snippets/` (one-shot operational SQL).

---

## 13. Phase 5 design notes — member portal & self-submitted testimonials

The schema already supports member auth via `members.user_id` (nullable FK to `auth.users`) and the initial RLS policies grant `members read self` + `members read own attendance`. Phase 5 builds on that.

**Bundle, don't piecemeal.** Member-facing features only justify the auth investment if a few ship together. Don't build "submit testimonial" alone — pair with: view own attendance history, regenerate own QR (rate-limited), update contact info, and (eventually) see own dues. Members won't create accounts for one feature.

**Adoption reality:** Audience skews older (60+). Realistic adoption is 10–20% of active members. That's still a win — half a dozen authentic testimonials a year — but don't over-engineer assuming high uptake.

**Testimonials schema additions (when phase lands):**
```sql
alter table public.testimonials
  add column member_id uuid references public.members(id) on delete set null,
  add column status text check (status in ('pending','approved','rejected')) default 'approved',
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by_user_id uuid references auth.users(id) on delete set null,
  add column reviewer_note text;
```
Existing 15 admin-written testimonials default to `status='approved'`, `member_id=null` — backwards compatible. Public `/about` query becomes `where active = true and status = 'approved'`.

**Linking auth → member row** on signup: match by email. If `auth.users.email` matches a `members.email` row, set `members.user_id` to the new auth id. New auth users with no matching member row are members-in-waiting; either auto-create a stub member or block with a "your email isn't on our roster — please use the registration form first" message.

**Approval flow:** member submits → status='pending' → admin gets a tile on `/admin` overview ("N testimonials awaiting review") → `/admin/testimonials?status=pending` → approve/reject inline → on approve, optionally Resend an email to the member ("Your testimonial is now live"). Existing CRUD already at `/admin/testimonials` — extend it.

---

## 14. Working principles for future Claude

- **Don't add features beyond what was asked.** Phase 1.1 is content migration. Don't sneak in Phase 2 UI under the guise of "while I was there." Bug fixes don't need surrounding cleanup.
- **Don't hardcode what should be DB-driven.** Classes, sessions, testimonials, news posts → all Supabase. The founder will eventually edit these via Studio (then admin UI).
- **Preserve the founder's voice.** Migrate content **verbatim** when scraping the old site. Tom and the founder can revise after.
- **Free-tier guardrail.** Never suggest a paid service without explicit user approval. This is a non-profit.
- **Accessibility is not optional.** The audience skews older; visual flourish must never compromise readability or focus visibility.
- **Clarify before destructive action.** The user explicitly worked through `git init` confusion; assume similar care for any irreversible op (force push, db drop, destructive migrations).
- **Match the editorial-quiet aesthetic.** Refined > clever. No purple gradients, no glassmorphism, no neon. The crane crest is the brand anchor.
