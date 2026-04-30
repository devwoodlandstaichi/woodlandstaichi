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

# Inline interpolation is fine for dev defaults — values aren't user-supplied.
docker exec -i "${CONTAINER}" psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -q <<EOSQL
do \$\$
declare uid uuid;
declare e text := '${DEV_EMAIL}';
declare p text := '${DEV_PASS}';
begin
  select id into uid from auth.users where email = e;
  if uid is null then
    -- GoTrue refuses to scan NULL in confirmation_token / recovery_token /
    -- email_change_token_* / phone_change* / reauthentication_token —
    -- it errors with "converting NULL to string is unsupported" on /otp
    -- and other endpoints. Studio's "Add user" UI sets them to '' which
    -- is what GoTrue expects. Mirror that here so manually-created users
    -- can sign in / receive OTPs.
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
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', '', '', '', '', ''
    ) returning id into uid;
  end if;
  insert into public.user_roles (user_id, role)
    values (uid, 'admin')
    on conflict (user_id) do update set role = 'admin';
end \$\$;
EOSQL

echo "✔ Dev admin ready: ${DEV_EMAIL} (role=admin)"
