-- World Tai Chi Day events. One row per year. The /world-tai-chi-day
-- page reads this table instead of the previously-hardcoded
-- WTCD_EVENTS array in src/lib/site-data.ts so admins can manage
-- posters / dates / gallery links without code changes.
--
-- "upcoming" is NOT stored — derived at render time from
-- event_date >= today, so the page auto-rolls year over year.

create table public.wtcd_events (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  event_date date not null,
  location text not null default 'The Woodlands, TX',
  intro text,
  poster_url text,
  poster_path text,
  gallery_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wtcd_events_event_date_idx
  on public.wtcd_events (event_date desc);

create trigger wtcd_events_updated_at
  before update on public.wtcd_events
  for each row execute function public.set_updated_at();

alter table public.wtcd_events enable row level security;

create policy "anyone reads active wtcd events"
  on public.wtcd_events for select
  using (active = true);

create policy "staff manage wtcd events"
  on public.wtcd_events for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Bucket: public read, no per-row metadata. Mirrors `news` and
-- `instructor-photos`.
insert into storage.buckets (id, name, public)
values ('wtcd-posters', 'wtcd-posters', true)
on conflict (id) do nothing;

drop policy if exists "wtcd-posters bucket: public read" on storage.objects;
create policy "wtcd-posters bucket: public read"
  on storage.objects for select
  using (bucket_id = 'wtcd-posters');

drop policy if exists "wtcd-posters bucket: staff insert" on storage.objects;
create policy "wtcd-posters bucket: staff insert"
  on storage.objects for insert
  with check (
    bucket_id = 'wtcd-posters' and public.is_admin_or_instructor(auth.uid())
  );

drop policy if exists "wtcd-posters bucket: staff update" on storage.objects;
create policy "wtcd-posters bucket: staff update"
  on storage.objects for update
  using (
    bucket_id = 'wtcd-posters' and public.is_admin_or_instructor(auth.uid())
  )
  with check (
    bucket_id = 'wtcd-posters' and public.is_admin_or_instructor(auth.uid())
  );

drop policy if exists "wtcd-posters bucket: staff delete" on storage.objects;
create policy "wtcd-posters bucket: staff delete"
  on storage.objects for delete
  using (
    bucket_id = 'wtcd-posters' and public.is_admin_or_instructor(auth.uid())
  );
