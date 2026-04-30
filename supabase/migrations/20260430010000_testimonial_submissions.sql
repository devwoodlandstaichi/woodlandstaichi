-- Phase 5.1: self-submitted testimonials with admin approval queue.
-- Existing 15 admin-written rows default to status='approved' so they
-- keep rendering on /about without a backfill.

alter table public.testimonials
  add column member_id uuid references public.members(id) on delete set null,
  add column status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected')),
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz,
  add column reviewed_by_user_id uuid references auth.users(id) on delete set null,
  add column reviewer_note text;

create index testimonials_status_idx on public.testimonials (status);
create index testimonials_member_id_idx on public.testimonials (member_id);

-- Public read becomes status-aware: approved AND active. The original
-- "anyone reads active testimonials" policy let pending/rejected rows
-- leak as long as `active` was true.
drop policy if exists "anyone reads active testimonials" on public.testimonials;
create policy "anyone reads approved testimonials"
  on public.testimonials for select
  using (active = true and status = 'approved');

-- Members can read their own submissions (any status) so the portal
-- can show pending / rejected with reviewer notes.
create policy "members read own testimonials"
  on public.testimonials for select
  using (
    auth.uid() is not null
    and member_id in (
      select id from public.members where user_id = auth.uid()
    )
  );

-- Members can submit. Constrained to pending + active=false + their
-- own member_id so the policy can't be abused to publish directly or
-- impersonate another member.
create policy "members submit testimonials"
  on public.testimonials for insert
  with check (
    auth.uid() is not null
    and status = 'pending'
    and active = false
    and member_id in (
      select id from public.members where user_id = auth.uid()
    )
  );
