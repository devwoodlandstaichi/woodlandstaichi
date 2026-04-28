#!/usr/bin/env bash
# Copies the public.members table from your local Supabase to a remote
# (production) one. Safe to re-run — uses ON CONFLICT (email) DO NOTHING.
#
# Strips columns that don't make sense to copy:
#   id              -> regenerated in prod (FK refs from local don't follow)
#   user_id         -> would FK-violate (auth.users from local doesn't exist)
#   qr_token        -> signed with local QR_TOKEN_SECRET; useless in prod
#   qr_issued_at    -> ditto
#   qr_revoked_at   -> ditto
#   created_at      -> regenerated
#   updated_at      -> regenerated
#
# After import you'll click "Bulk issue QRs" on the cloud /admin/members
# to give every member a fresh prod-signed token.
#
# Usage:
#   ./scripts/migrate-members-to-prod.sh \
#     "postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"
#
# Or set CLOUD_DB_URL env var and just run:
#   ./scripts/migrate-members-to-prod.sh

set -euo pipefail

LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
CLOUD_DB_URL="${CLOUD_DB_URL:-${1:-}}"

if [[ -z "$CLOUD_DB_URL" ]]; then
  echo "ERROR: missing cloud DB URL." >&2
  echo "Pass it as the first argument or set CLOUD_DB_URL env var." >&2
  echo "It looks like:" >&2
  echo "  postgres://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" >&2
  echo "Find the password in Supabase dashboard → Settings → Database." >&2
  exit 1
fi

DUMP_FILE="$(mktemp -t wtc-members-XXXXXX.sql)"
trap 'rm -f "$DUMP_FILE"' EXIT

echo "==> Reading local members..."
LOCAL_COUNT=$(psql "$LOCAL_DB_URL" -tA -c "SELECT count(*) FROM public.members" | tr -d '[:space:]')
echo "    Found $LOCAL_COUNT members locally."

if [[ "$LOCAL_COUNT" == "0" ]]; then
  echo "    Nothing to migrate. Exiting."
  exit 0
fi

echo "==> Generating INSERT statements..."
# Use format() with %L so values are SQL-escaped exactly once. ON CONFLICT
# guards against re-runs and also against duplicates that may already
# exist in prod (e.g., from CSV import before this script).
psql "$LOCAL_DB_URL" -tA -c "
SELECT format(
  'INSERT INTO public.members (
    first_name, last_name, nickname, email, phone,
    street, city, state, postal_code, birthday,
    level, status,
    physical_limitations, prior_experience,
    found_us_via, expectations,
    emergency_contact_name, emergency_contact_relationship, emergency_phone,
    waiver_signed_at, waiver_ip, waiver_user_agent
  ) VALUES (
    %L, %L, %L, %L, %L,
    %L, %L, %L, %L, %L,
    %L::member_level, %L::member_status,
    %L, %L,
    %L, %L,
    %L, %L, %L,
    %L, %L, %L
  ) ON CONFLICT (email) DO NOTHING;',
  first_name, last_name, nickname, email, phone,
  street, city, state, postal_code, birthday,
  level::text, status::text,
  physical_limitations, prior_experience,
  found_us_via, expectations,
  emergency_contact_name, emergency_contact_relationship, emergency_phone,
  waiver_signed_at, waiver_ip, waiver_user_agent
) FROM public.members ORDER BY last_name, first_name;
" > "$DUMP_FILE"

LINES=$(wc -l < "$DUMP_FILE" | tr -d '[:space:]')
echo "    Wrote $LINES INSERT statements to $DUMP_FILE"

echo "==> Pushing to cloud..."
# Wrap the whole import in a transaction so a single bad row doesn't
# leave the table half-populated.
{
  echo "BEGIN;"
  cat "$DUMP_FILE"
  echo "COMMIT;"
} | psql "$CLOUD_DB_URL" -v ON_ERROR_STOP=1 -q

echo ""
echo "==> Verifying..."
CLOUD_COUNT=$(psql "$CLOUD_DB_URL" -tA -c "SELECT count(*) FROM public.members" | tr -d '[:space:]')
echo "    Cloud now has $CLOUD_COUNT members."

echo ""
echo "✓ Done."
echo ""
echo "Next steps:"
echo "  1. Open Supabase cloud Studio → public.members → eyeball a few rows"
echo "  2. Sign in to your production /admin"
echo "  3. /admin/members → Bulk issue QRs (issues prod-signed tokens for everyone)"
