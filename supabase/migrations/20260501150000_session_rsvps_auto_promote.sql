-- When an approved RSVP leaves the approved state (member cancels, or
-- admin moves them to pending/waitlisted/rejected) and the session is
-- no longer at capacity, promote the head of the waitlist (earliest
-- requested_at) to approved. Members will see the promotion on their
-- next /members/me/sessions render; we don't auto-send an email here
-- (that's Phase C territory). Admin can re-send the approval roster
-- from the session detail page if they want a one-line confirmation
-- to go out.

create or replace function public.session_rsvps_auto_promote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap integer;
  cur integer;
  promote_id uuid;
begin
  -- Only react to an approved seat opening up.
  if old.status = 'approved' and new.status <> 'approved' then
    select coalesce(cs.capacity, c.capacity) into cap
    from public.class_sessions cs
    left join public.classes c on c.id = cs.class_id
    where cs.id = new.class_session_id;

    -- No capacity = no waitlist semantics. Skip.
    if cap is null then return new; end if;

    select count(*) into cur
    from public.session_rsvps
    where class_session_id = new.class_session_id
      and status = 'approved'
      and id <> new.id;

    if cur >= cap then return new; end if;

    -- Head of the waitlist, oldest first.
    select id into promote_id
    from public.session_rsvps
    where class_session_id = new.class_session_id
      and status = 'waitlisted'
    order by requested_at asc
    limit 1;

    if promote_id is not null then
      -- This update will re-fire the capacity guard (which will allow
      -- it since we just freed a seat) and this trigger (which will
      -- not recurse because the new row's old.status is 'waitlisted',
      -- not 'approved').
      update public.session_rsvps
      set status = 'approved',
          reviewed_at = now()
      where id = promote_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger session_rsvps_auto_promote
  after update of status on public.session_rsvps
  for each row execute function public.session_rsvps_auto_promote();
