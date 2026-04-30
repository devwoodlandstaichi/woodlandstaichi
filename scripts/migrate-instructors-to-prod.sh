#!/usr/bin/env bash
# Copies the public.instructors table from your local Supabase to a remote
# (production) one. Safe to re-run — uses WHERE NOT EXISTS on (name) so
# rows already in prod are skipped.
#
# Strips columns that don't make sense to copy:
#   id              -> regenerated in prod (no FK refs follow from local)
#   member_id       -> would FK-violate (members ids differ between envs)
#   photo_url       -> points at 127.0.0.1:54321; useless in prod. Re-upload
#                      via /admin/instructors after migration.
#   created_at      -> regenerated
#   updated_at      -> regenerated
#
# Usage:
#   ./scripts/migrate-instructors-to-prod.sh \
#     "postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"
#
# Or set CLOUD_DB_URL env var and just run:
#   ./scripts/migrate-instructors-to-prod.sh

set -euo pipefail

PSQL="${PSQL:-psql}"
if ! command -v "$PSQL" >/dev/null 2>&1; then
  if [[ -x /opt/homebrew/Cellar/libpq/18.3/bin/psql ]]; then
    PSQL=/opt/homebrew/Cellar/libpq/18.3/bin/psql
  else
    echo "ERROR: psql not on PATH. brew install libpq, or set PSQL=/path/to/psql." >&2
    exit 1
  fi
fi

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

DUMP_FILE="$(mktemp -t wtc-instructors-XXXXXX.sql)"
trap 'rm -f "$DUMP_FILE"' EXIT

echo "==> Reading local instructors..."
LOCAL_COUNT=$("$PSQL" "$LOCAL_DB_URL" -tA -c "SELECT count(*) FROM public.instructors" | tr -d '[:space:]')
echo "    Found $LOCAL_COUNT instructors locally."

if [[ "$LOCAL_COUNT" == "0" ]]; then
  echo "    Nothing to migrate. Exiting."
  exit 0
fi

echo "==> Generating INSERT statements..."
"$PSQL" "$LOCAL_DB_URL" -tA -c "
SELECT format(
  'INSERT INTO public.instructors (name, tier, title, bio, display_order, active)
   SELECT %L, %L::instructor_tier, %L, %L, %s, %L
   WHERE NOT EXISTS (SELECT 1 FROM public.instructors WHERE name = %L);',
  name, tier::text, title, bio, display_order, active::text,
  name
) FROM public.instructors ORDER BY tier, display_order, name;
" > "$DUMP_FILE"

LINES=$(wc -l < "$DUMP_FILE" | tr -d '[:space:]')
echo "    Wrote $LINES INSERT statements to $DUMP_FILE"

echo "==> Pushing to cloud..."
{
  echo "BEGIN;"
  cat "$DUMP_FILE"
  echo "COMMIT;"
} | "$PSQL" "$CLOUD_DB_URL" -v ON_ERROR_STOP=1 -q

echo ""
echo "==> Verifying..."
CLOUD_COUNT=$("$PSQL" "$CLOUD_DB_URL" -tA -c "SELECT count(*) FROM public.instructors" | tr -d '[:space:]')
echo "    Cloud now has $CLOUD_COUNT instructors."

echo ""
echo "✓ Done."
echo ""
echo "Next steps:"
echo "  1. Open Supabase cloud Studio → public.instructors → eyeball rows"
echo "  2. /admin/instructors on prod → upload portrait photos as needed"
echo "     (photo_url was stripped — local URLs point at 127.0.0.1)"
