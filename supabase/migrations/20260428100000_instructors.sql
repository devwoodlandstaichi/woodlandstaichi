-- Volunteer instructor roster — what shows on /about/instructors.
-- Was hardcoded; now editable by staff via /admin/instructors.

create type instructor_tier as enum (
  'founder',
  'senior',
  'instructor',
  'assistant'
);

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier instructor_tier not null default 'instructor',
  title text,
  bio text,
  display_order int not null default 0,
  active boolean not null default true,
  -- Optional link to a member row if the instructor is also a member.
  -- Useful for de-duping later but not required.
  member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index instructors_active_tier_order_idx
  on public.instructors (active, tier, display_order)
  where active = true;

create trigger set_updated_at_instructors before update on public.instructors
  for each row execute function public.set_updated_at();

alter table public.instructors enable row level security;

create policy "anyone reads active instructors"
  on public.instructors for select
  using (active = true);

create policy "admins manage instructors"
  on public.instructors for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));
