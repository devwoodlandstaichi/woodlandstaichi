-- Public registration on /classes/register lists newcomer-flagged
-- sessions so first-timers can pick a date. The page runs
-- unauthenticated, so RLS on public.class_sessions previously hid
-- every row from anon — hence the empty "No newcomer-welcoming
-- sessions are open right now" message even when sessions had been
-- flagged by staff.
--
-- This policy grants anon SELECT, but only on the narrow set the
-- registration page actually needs: future-dated AND
-- newcomer_friendly. Past sessions and non-flagged sessions stay
-- invisible to the public.

create policy "anyone reads upcoming newcomer sessions"
  on public.class_sessions for select
  using (
    newcomer_friendly = true
    and session_date >= current_date
  );
