#!/usr/bin/env bash
# Restore local Supabase to a "ready to sign in" state after `npm run db:reset`.
#
# What it does (idempotent):
#   1. Applies supabase/seed.local.sql if present (real members dumped from
#      prod; gitignored — keep your laptop's PII off git).
#   2. Ensures a dev admin exists in auth.users with a known dev password.
#   3. Promotes that user to 'admin' in public.user_roles.
#
# Override via env:
#   DEV_ADMIN_EMAIL=foo@bar.com DEV_ADMIN_PASSWORD=Secret123! npm run db:restore

set -euo pipefail

DEV_EMAIL="${DEV_ADMIN_EMAIL:-tomgutzjr@gmail.com}"
DEV_PASS="${DEV_ADMIN_PASSWORD:-LocalDev2026!}"
CONTAINER="supabase_db_woodlandstaichi"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "✗ Local Supabase isn't running. Start it with: npm run db:start" >&2
  exit 1
fi

if [ -f "supabase/seed.local.sql" ]; then
  docker cp supabase/seed.local.sql "${CONTAINER}":/tmp/seed.local.sql >/dev/null
  docker exec "${CONTAINER}" psql -U postgres -d postgres -q \
    -f /tmp/seed.local.sql >/dev/null
  echo "✔ Applied supabase/seed.local.sql"
else
  echo "· No supabase/seed.local.sql to apply (skipped)"
fi

# Re-run the testimonial-link backfill migration. The migration itself
# is idempotent, but in this two-stage local workflow the migration
# fires before seed.local.sql loads members — so we replay it here once
# the members table is populated. On prod, the migration runs against
# already-existing members and this script is never invoked.
if [ -f "supabase/migrations/20260430020000_backfill_testimonial_member_links.sql" ]; then
  docker cp supabase/migrations/20260430020000_backfill_testimonial_member_links.sql \
    "${CONTAINER}":/tmp/backfill.sql >/dev/null
  docker exec "${CONTAINER}" psql -U postgres -d postgres -q \
    -f /tmp/backfill.sql >/dev/null
  linked=$(docker exec "${CONTAINER}" psql -U postgres -d postgres -tAc \
    "select count(*) from public.testimonials where member_id is not null")
  echo "✔ Backfilled testimonial → member links (${linked} linked)"
fi

# Re-run the attribution → submitted_at parsing on the freshly-seeded
# testimonials. Same staging quirk as the link backfill: the migration
# fires before seed.sql inserts the rows, so locally we replay it now.
if [ -f "supabase/migrations/20260430040000_testimonial_attribution_to_date.sql" ]; then
  docker cp supabase/migrations/20260430040000_testimonial_attribution_to_date.sql \
    "${CONTAINER}":/tmp/attr.sql >/dev/null
  docker exec "${CONTAINER}" psql -U postgres -d postgres -q \
    -f /tmp/attr.sql >/dev/null
  parsed=$(docker exec "${CONTAINER}" psql -U postgres -d postgres -tAc \
    "select count(*) from public.testimonials where submitted_at is not null")
  echo "✔ Parsed testimonial attribution dates (${parsed} dated)"
fi

# ensure_user EMAIL PASSWORD PASSWORD_SET ROLE
#   PASSWORD_SET = "true" or "" (empty = unset, so /members/me's gate fires)
#   ROLE         = "admin" / "instructor" / "" (empty = no role row)
#
# Idempotent. Reconciles the public.members row's user_id to the
# auth row id so seeded members re-link after every reset (without
# this, an old user_id from a previous run would block linkSelfByEmail
# with "already linked to a different account").
ensure_user() {
  local email="$1" pass="$2" pwset="$3" role="$4"
  docker exec -i "${CONTAINER}" psql -U postgres -d postgres \
    -v ON_ERROR_STOP=1 -q <<EOSQL >/dev/null
do \$\$
declare uid uuid;
declare e text := '${email}';
declare p text := '${pass}';
declare meta jsonb;
begin
  meta := case
    when '${pwset}' = 'true' then '{"password_set": true}'::jsonb
    else '{}'::jsonb
  end;

  select id into uid from auth.users where email = e;
  if uid is null then
    -- GoTrue refuses to scan NULL in confirmation_token / recovery_token /
    -- email_change_token_* / phone_change* / reauthentication_token
    -- ("converting NULL to string is unsupported" on /otp). Studio's
    -- "Add user" UI sets them to '' — mirror that.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token,
      email_change_token_new, email_change,
      phone_change, phone_change_token, email_change_token_current,
      reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated',
      e, crypt(p, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      meta,
      '', '', '', '', '', '', '', ''
    ) returning id into uid;
  else
    -- Reconcile metadata if password_set was supposed to be true.
    if '${pwset}' = 'true' then
      update auth.users
        set raw_user_meta_data =
          coalesce(raw_user_meta_data, '{}'::jsonb) || '{"password_set": true}'::jsonb
        where id = uid;
    end if;
  end if;

  -- Re-anchor the matching member row to this auth.users.id, even if
  -- it pointed at a stale id from a previous reset cycle.
  update public.members set user_id = uid where email = e;

  if '${role}' <> '' then
    insert into public.user_roles (user_id, role)
      values (uid, '${role}'::user_role)
      on conflict (user_id) do update set role = excluded.role;
  end if;
end \$\$;
EOSQL
}

ensure_user "${DEV_EMAIL}" "${DEV_PASS}" "true" "admin"
echo "✔ Dev admin ready: ${DEV_EMAIL} (role=admin)"

# Persistent member test user — exercises the magic-link onboarding +
# password gate. password_set is intentionally unset so /members/me
# prompts on first visit. The known password lets you also test the
# direct password sign-in flow if you want.
DEV_MEMBER_EMAIL="${DEV_MEMBER_EMAIL:-chanthy.gutierrez@gmail.com}"
DEV_MEMBER_PASS="${DEV_MEMBER_PASS:-LocalDev2026!}"
ensure_user "${DEV_MEMBER_EMAIL}" "${DEV_MEMBER_PASS}" "" ""
echo "✔ Test member ready: ${DEV_MEMBER_EMAIL} (no role, gate will fire)"
