-- Enable Supabase realtime on the two tables the kiosk subscribes to.
-- Members already have read access via RLS for their own rows; the
-- kiosk runs under staff session, which has broader read via the
-- "staff manage *" / public-read policies on these tables.
--
-- Idempotent: ALTER PUBLICATION ADD TABLE skips when already added,
-- but the explicit guard here avoids a noisy error on re-runs.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'attendance'
  ) then
    alter publication supabase_realtime add table public.attendance;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'session_rsvps'
  ) then
    alter publication supabase_realtime add table public.session_rsvps;
  end if;
end $$;
