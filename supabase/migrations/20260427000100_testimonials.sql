-- Testimonials migrated from the old WordPress site.
-- Public read access; admin-only writes.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  member_name text not null,
  attribution text,        -- e.g., "member since 2017", "retired nurse", "8/5/21"
  quote text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_active_order_idx
  on public.testimonials (active, display_order)
  where active = true;

create trigger set_updated_at_testimonials before update on public.testimonials
  for each row execute function public.set_updated_at();

alter table public.testimonials enable row level security;

create policy "anyone reads active testimonials"
  on public.testimonials for select
  using (active = true);

create policy "admins manage testimonials"
  on public.testimonials for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));
