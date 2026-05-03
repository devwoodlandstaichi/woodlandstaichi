-- Smoke tests for the two session_rsvps triggers:
--   1. session_rsvps_capacity_guard refuses approvals past capacity
--   2. session_rsvps_auto_promote promotes the head of the waitlist
--      when an approved seat opens
--
-- Wraps everything in a transaction and ROLLBACKs at the end so
-- nothing persists. Run via:
--   docker exec -i supabase_db_woodlandstaichi psql -U postgres -d postgres < supabase/snippets/test-session-rsvps.sql

begin;

-- Pin the search_path so we don't accidentally pick up role-shadowed
-- public schema items.
set local search_path = public;

-- Set up a class with capacity 2 and a session in the future.
do $$
declare
  class_id uuid;
  session_id uuid;
  m1 uuid;
  m2 uuid;
  m3 uuid;
  rsvp1 uuid;
  rsvp2 uuid;
  rsvp3 uuid;
  approved_count int;
begin
  insert into public.classes (
    name, level, location, day_of_week, start_time, end_time,
    capacity, active, display_order
  )
  values (
    'TEST capacity guard', 'beginners', 'Test',
    'mon', '09:00:00', '10:00:00', 2, true, 999
  )
  returning id into class_id;

  insert into public.class_sessions (
    class_id, session_date, start_time, end_time
  )
  values (class_id, current_date + 7, '09:00:00', '10:00:00')
  returning id into session_id;

  insert into public.members (
    first_name, last_name, email, phone, level, status
  )
  values
    ('Alice', 'Test', 'alice-test-' || extract(epoch from now()) || '@x.test', '0000000001', 'beginners', 'active'),
    ('Bob',   'Test', 'bob-test-'   || extract(epoch from now()) || '@x.test', '0000000002', 'beginners', 'active'),
    ('Carol', 'Test', 'carol-test-' || extract(epoch from now()) || '@x.test', '0000000003', 'beginners', 'active');

  -- Fetch the three member ids by their distinctive emails.
  select id into m1 from public.members where first_name = 'Alice' and last_name = 'Test' order by created_at desc limit 1;
  select id into m2 from public.members where first_name = 'Bob'   and last_name = 'Test' order by created_at desc limit 1;
  select id into m3 from public.members where first_name = 'Carol' and last_name = 'Test' order by created_at desc limit 1;

  -- Two pending requests.
  insert into public.session_rsvps (class_session_id, member_id, status)
  values
    (session_id, m1, 'pending'),
    (session_id, m2, 'pending');
  select id into rsvp1 from public.session_rsvps where class_session_id = session_id and member_id = m1;
  select id into rsvp2 from public.session_rsvps where class_session_id = session_id and member_id = m2;

  -- Approve both — should succeed since capacity is 2.
  update public.session_rsvps set status = 'approved' where id = rsvp1;
  update public.session_rsvps set status = 'approved' where id = rsvp2;
  raise notice 'TEST 1a OK: approved 2 of 2 within capacity';

  -- A third member requests, then admin tries to approve — should fail.
  insert into public.session_rsvps (class_session_id, member_id, status)
  values (session_id, m3, 'pending');
  select id into rsvp3 from public.session_rsvps where class_session_id = session_id and member_id = m3;

  begin
    update public.session_rsvps set status = 'approved' where id = rsvp3;
    raise exception 'TEST 1b FAIL: capacity guard let an overbooking through';
  exception when others then
    if sqlerrm like '%at capacity%' then
      raise notice 'TEST 1b OK: capacity guard refused the third approval (% / 2)', 2;
    else
      raise;
    end if;
  end;

  -- Move m3 to waitlisted manually — simulating admin's choice.
  update public.session_rsvps set status = 'waitlisted' where id = rsvp3;

  -- Cancel an approved seat — auto_promote should pick m3.
  update public.session_rsvps set status = 'cancelled' where id = rsvp1;

  select count(*) into approved_count
  from public.session_rsvps
  where class_session_id = session_id and status = 'approved';

  if approved_count <> 2 then
    raise exception 'TEST 2 FAIL: expected 2 approved after promote, got %', approved_count;
  end if;

  -- Check m3 is now approved (not still waitlisted).
  if not exists (
    select 1 from public.session_rsvps where id = rsvp3 and status = 'approved'
  ) then
    raise exception 'TEST 2 FAIL: m3 was not auto-promoted from waitlist';
  end if;

  raise notice 'TEST 2 OK: head-of-waitlist auto-promoted on cancel';
end $$;

rollback;
