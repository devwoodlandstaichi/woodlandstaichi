-- Returning-player reactivation queue. The old returning form let
-- inactive members re-register themselves into a class outright; the
-- new flow is "ask for permission, founder approves". This table
-- tracks each request through pending → approved/rejected with the
-- reviewer attribution + note that the member sees on email.

create type reactivation_status as enum ('pending', 'approved', 'rejected');

create table public.member_reactivation_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  email text not null,
  status reactivation_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  reviewer_note text,
  request_ip text,
  request_user_agent text,
  created_at timestamptz not null default now()
);

create index member_reactivation_status_idx
  on public.member_reactivation_requests (status);
create index member_reactivation_member_id_idx
  on public.member_reactivation_requests (member_id);

alter table public.member_reactivation_requests enable row level security;

-- Staff manage. The public form hits this via the service-role admin
-- client in a server action, so no public-insert policy is needed.
create policy "admins manage reactivation requests"
  on public.member_reactivation_requests for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));
