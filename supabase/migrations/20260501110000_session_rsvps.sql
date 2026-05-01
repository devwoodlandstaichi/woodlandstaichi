-- Phase A of session RSVPs. Members request to attend a specific
-- class_session; admin reviews. Hard cap at session/class capacity is
-- enforced by trigger so a race between two admins can't overbook.
-- No emails fire from the DB — admin triggers the roster sends from
-- the admin panel and we stamp class_sessions.{approvals,rejections}
-- _sent_at to keep an audit trail.

create type session_rsvp_status as enum (
  'pending',     -- member submitted, awaiting admin review
  'approved',    -- admin OK; counts against capacity
  'waitlisted',  -- approved-pending — promoted manually if a slot opens
  'rejected',    -- admin said no
  'cancelled'    -- member backed out (any prior status)
);

create table public.session_rsvps (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null
    references public.class_sessions(id) on delete cascade,
  member_id uuid not null
    references public.members(id) on delete cascade,
  status session_rsvp_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewer_note text,
  -- Stamped when this row was included in a sent batch (approval or
  -- rejection). Used so re-sends to a session only BCC newly-decided
  -- people, not everyone all over again.
  notified_at timestamptz,
  request_ip text,
  request_user_agent text,
  created_at timestamptz not null default now(),
  unique (class_session_id, member_id)
);

create index session_rsvps_session_idx
  on public.session_rsvps (class_session_id);
create index session_rsvps_member_idx
  on public.session_rsvps (member_id);
create index session_rsvps_status_idx
  on public.session_rsvps (status);

alter table public.session_rsvps enable row level security;

-- Members can see only their own rows.
create policy "members read own rsvps"
  on public.session_rsvps for select
  using (
    auth.uid() is not null
    and member_id in (
      select id from public.members where user_id = auth.uid()
    )
  );

-- Members can submit a new request, constrained to themselves and
-- pending. Cancel / re-request / status change goes through server
-- actions that use the admin client — no member UPDATE/DELETE here.
create policy "members create own rsvps"
  on public.session_rsvps for insert
  with check (
    auth.uid() is not null
    and status = 'pending'
    and member_id in (
      select id from public.members where user_id = auth.uid()
    )
  );

-- Staff full access.
create policy "staff manage rsvps"
  on public.session_rsvps for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Capacity guard. Refuses to flip a row to 'approved' if doing so
-- would push approved count past the session capacity (or the parent
-- class.capacity if the session has none of its own). Belt-and-braces
-- with the UI's disabled-when-full button — if two admins click at
-- the same instant only one can win.
create or replace function public.session_rsvps_capacity_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap integer;
  cur integer;
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    select coalesce(cs.capacity, c.capacity) into cap
    from public.class_sessions cs
    left join public.classes c on c.id = cs.class_id
    where cs.id = new.class_session_id;

    if cap is not null then
      select count(*) into cur
      from public.session_rsvps
      where class_session_id = new.class_session_id
        and status = 'approved'
        and id <> new.id;
      if cur >= cap then
        raise exception 'Session is at capacity (% / %)', cur, cap
          using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger session_rsvps_capacity_guard
  before insert or update of status on public.session_rsvps
  for each row execute function public.session_rsvps_capacity_guard();

-- ---------------------------------------------------------------------
-- class_sessions: per-session RSVP gate + roster-email audit columns.
-- ---------------------------------------------------------------------
alter table public.class_sessions
  add column accepting_rsvps boolean not null default true,
  add column approvals_sent_at timestamptz,
  add column approvals_sent_by_user_id uuid
    references auth.users(id) on delete set null,
  add column rejections_sent_at timestamptz,
  add column rejections_sent_by_user_id uuid
    references auth.users(id) on delete set null;

-- ---------------------------------------------------------------------
-- app_settings: cutoff window + level visibility matrix.
-- The matrix is keyed by member_level → array of class.level values
-- the member is allowed to RSVP for. Defaults follow the "at-or-below"
-- intuition: an intermediate member sees intermediate + beginners,
-- never advanced. Editable from a settings page later.
-- ---------------------------------------------------------------------
alter table public.app_settings
  add column rsvp_cutoff_minutes integer not null default 240
    check (rsvp_cutoff_minutes >= 0),
  add column rsvp_level_matrix jsonb not null default '{
    "instructor": ["instructor", "advanced", "intermediate", "beginners"],
    "advanced":   ["advanced", "intermediate", "beginners"],
    "intermediate": ["intermediate", "beginners"],
    "beginners":  ["beginners"]
  }'::jsonb;
