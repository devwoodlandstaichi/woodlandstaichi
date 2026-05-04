-- Public-callable function returning the approved-RSVP count for a
-- batch of class_sessions. Lets the /classes page surface "X / cap"
-- on each welcoming session card without exposing the underlying
-- session_rsvps rows (which include member_id) to anon. Staff side
-- continues to read session_rsvps directly via the existing
-- "staff manage rsvps" policy.

create or replace function public.count_approved_rsvps_by_session(
  session_ids uuid[]
)
returns table(class_session_id uuid, approved bigint)
language sql
stable
security definer
set search_path = public
as $$
  select class_session_id, count(*)::bigint
  from public.session_rsvps
  where status = 'approved'
    and class_session_id = any(session_ids)
  group by class_session_id;
$$;

grant execute on function public.count_approved_rsvps_by_session(uuid[])
  to anon, authenticated;
