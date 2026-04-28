#!/usr/bin/env bash
# Reverse of migrate-members-to-prod.sh — copies public.members from
# the production Supabase project back down to your local Supabase.
# Use after a `supabase db reset` wipes local data, or to refresh
# local with the latest production roster.
#
# Strips the same FK + secret columns as the forward script:
#   id, user_id, qr_token, qr_issued_at, qr_revoked_at,
#   created_at, updated_at
#
# After running, click "Bulk issue QRs" on local /admin/members if
# you need fresh local-secret-signed QR tokens for testing.
#
# Usage:
#   ./scripts/restore-members-from-prod.sh \
#     "host=aws-1-us-west-2.pooler.supabase.com port=5432 \
#      user=postgres.<ref> dbname=postgres sslmode=require"
#
#   With password as $CLOUD_PGPASSWORD env var so it doesn't end up
#   on the command line.

set -euo pipefail

LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
LOCAL_PGPASSWORD="${LOCAL_PGPASSWORD:-postgres}"

CLOUD_PARAMS="${CLOUD_PARAMS:-${1:-}}"
if [[ -z "$CLOUD_PARAMS" ]]; then
  echo "ERROR: missing cloud connection params." >&2
  echo "Pass key=value libpq params as the first argument:" >&2
  echo "  host=aws-...pooler.supabase.com port=5432 \\" >&2
  echo "    user=postgres.<ref> dbname=postgres sslmode=require" >&2
  echo "Set CLOUD_PGPASSWORD in the env." >&2
  exit 1
fi

if [[ -z "${CLOUD_PGPASSWORD:-}" ]]; then
  echo "ERROR: set CLOUD_PGPASSWORD env var." >&2
  exit 1
fi

DUMP_FILE="$(mktemp -t wtc-restore-XXXXXX.sql)"
trap 'rm -f "$DUMP_FILE"' EXIT

echo "==> Reading cloud members..."
CLOUD_COUNT=$(PGPASSWORD="$CLOUD_PGPASSWORD" psql "$CLOUD_PARAMS" -tA \
  -c "SELECT count(*) FROM public.members" | tr -d '[:space:]')
echo "    Found $CLOUD_COUNT members in cloud."

if [[ "$CLOUD_COUNT" == "0" ]]; then
  echo "    Nothing to restore. Exiting."
  exit 0
fi

echo "==> Generating INSERT statements..."
PGPASSWORD="$CLOUD_PGPASSWORD" psql "$CLOUD_PARAMS" -tA -c "
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
    %L, %L, %L, %L,
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

echo "    Wrote $(grep -c INSERT "$DUMP_FILE") INSERTs"

echo "==> Pushing to local..."
{
  echo "BEGIN;"
  cat "$DUMP_FILE"
  echo "COMMIT;"
} | PGPASSWORD="$LOCAL_PGPASSWORD" psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -q

echo
echo "==> Verifying..."
LOCAL_COUNT=$(PGPASSWORD="$LOCAL_PGPASSWORD" psql "$LOCAL_DB_URL" -tA \
  -c "SELECT count(*) FROM public.members" | tr -d '[:space:]')
echo "    Local now has $LOCAL_COUNT members."

echo
echo "✓ Done."
