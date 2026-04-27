-- Woodlands Tai Chi — initial schema
-- Phase 1: members + classes + sessions + registrations + attendance
-- All tables ship with RLS enabled and deny-by-default policies.

-- =============================================================================
-- ENUMS
-- =============================================================================

create type member_level as enum ('instructor', 'beginners', 'intermediate', 'advanced');
create type member_status as enum ('active', 'waitlist', 'inactive');
create type class_level as enum ('beginners', 'intermediate', 'advanced', 'remedial', 'play_only', 'combined');
create type day_of_week as enum ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
create type payment_method as enum ('zelle', 'venmo', 'apple_pay', 'paypal', 'cash', 'other');
create type payment_status as enum ('pending', 'paid', 'waived', 'refunded');
create type attendance_method as enum ('qr', 'manual');
create type user_role as enum ('admin', 'instructor', 'member');

-- =============================================================================
-- MEMBERS
-- =============================================================================

create table public.members (
  id uuid primary key default gen_random_uuid(),
  -- link to auth.users when the member creates a login (optional)
  user_id uuid references auth.users(id) on delete set null unique,
  first_name text not null,
  last_name text not null,
  nickname text,
  email text not null unique,
  phone text not null,
  street text,
  city text,
  state text,
  postal_code text,
  birthday date,
  level member_level not null default 'beginners',
  status member_status not null default 'active',
  physical_limitations text,
  prior_experience text,
  found_us_via text,
  expectations text,
  -- waiver
  waiver_signed_at timestamptz,
  waiver_ip text,
  waiver_user_agent text,
  -- QR-code identity (Phase 3) — opaque token, HMAC-signed in app code
  qr_token text unique,
  qr_issued_at timestamptz,
  qr_revoked_at timestamptz,
  --
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_email_idx on public.members (email);
create index members_qr_token_idx on public.members (qr_token) where qr_token is not null;
create index members_level_idx on public.members (level);

-- =============================================================================
-- USER ROLES (admin/instructor lookup table)
-- =============================================================================

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'member',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin_or_instructor(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = uid and role in ('admin', 'instructor')
  );
$$;

-- =============================================================================
-- CLASSES (recurring class definitions)
-- =============================================================================

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level class_level not null,
  location text not null,
  location_address text,
  day_of_week day_of_week not null,
  start_time time not null,
  end_time time not null,
  capacity int,
  cohort_start_date date,
  description text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_active_idx on public.classes (active) where active = true;

-- =============================================================================
-- CLASS SESSIONS (specific occurrence on a date)
-- =============================================================================

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  instructor_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (class_id, session_date)
);

create index class_sessions_date_idx on public.class_sessions (session_date desc);

-- =============================================================================
-- REGISTRATIONS (member enrolls in a class cohort)
-- =============================================================================

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  shirt_size text,
  payment_method payment_method,
  payment_status payment_status not null default 'pending',
  payment_amount_cents int,
  payment_received_at timestamptz,
  notes text,
  registered_at timestamptz not null default now(),
  unique (member_id, class_id)
);

create index registrations_member_idx on public.registrations (member_id);
create index registrations_class_idx on public.registrations (class_id);

-- =============================================================================
-- ATTENDANCE
-- =============================================================================

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  class_session_id uuid not null references public.class_sessions(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  method attendance_method not null default 'qr',
  scanned_by_user_id uuid references auth.users(id) on delete set null,
  unique (member_id, class_session_id)
);

create index attendance_session_idx on public.attendance (class_session_id);
create index attendance_member_idx on public.attendance (member_id);
create index attendance_scanned_at_idx on public.attendance (scanned_at desc);

-- =============================================================================
-- updated_at triggers
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_members before update on public.members
  for each row execute function public.set_updated_at();
create trigger set_updated_at_classes before update on public.classes
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS — deny by default; explicit policies grant access
-- =============================================================================

alter table public.members enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.class_sessions enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance enable row level security;

-- Public read access for active classes (so the homepage can render the schedule)
create policy "anyone reads active classes"
  on public.classes for select
  using (active = true);

create policy "admins manage classes"
  on public.classes for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Members can read their own row; admins/instructors read all
create policy "members read self"
  on public.members for select
  using (auth.uid() = user_id or public.is_admin_or_instructor(auth.uid()));

create policy "members update self"
  on public.members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admins manage members"
  on public.members for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- user_roles: only admins can read/write
create policy "admins read roles"
  on public.user_roles for select
  using (public.is_admin_or_instructor(auth.uid()));

create policy "admins manage roles"
  on public.user_roles for all
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- class_sessions, registrations, attendance: admin/instructor only
create policy "staff read sessions"
  on public.class_sessions for select
  using (public.is_admin_or_instructor(auth.uid()));
create policy "staff manage sessions"
  on public.class_sessions for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

create policy "staff read registrations"
  on public.registrations for select
  using (public.is_admin_or_instructor(auth.uid()));
create policy "staff manage registrations"
  on public.registrations for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

create policy "staff read attendance"
  on public.attendance for select
  using (public.is_admin_or_instructor(auth.uid()));
create policy "staff manage attendance"
  on public.attendance for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Members can read their own attendance
create policy "members read own attendance"
  on public.attendance for select
  using (
    member_id in (select id from public.members where user_id = auth.uid())
  );
