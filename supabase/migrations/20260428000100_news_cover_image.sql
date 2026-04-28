-- News post cover images.
--
-- Store the image in the public `news` Storage bucket; persist the
-- public URL on the post for fast rendering and the path for cleanup
-- when an admin replaces or removes it.

alter table public.news_posts
  add column if not exists cover_image_url text,
  add column if not exists cover_image_path text;

-- Bucket: public read, no per-row metadata.
insert into storage.buckets (id, name, public)
values ('news', 'news', true)
on conflict (id) do nothing;

-- Storage RLS — staff writes (admins/instructors), everyone reads.
-- We also use the service-role client in actions.ts so writes still work
-- even if these policies drift, but having them keeps the dashboard happy
-- and lets a SQL-level reset behave correctly.

drop policy if exists "news bucket: public read" on storage.objects;
create policy "news bucket: public read"
  on storage.objects for select
  using (bucket_id = 'news');

drop policy if exists "news bucket: staff insert" on storage.objects;
create policy "news bucket: staff insert"
  on storage.objects for insert
  with check (
    bucket_id = 'news' and public.is_admin_or_instructor(auth.uid())
  );

drop policy if exists "news bucket: staff update" on storage.objects;
create policy "news bucket: staff update"
  on storage.objects for update
  using (bucket_id = 'news' and public.is_admin_or_instructor(auth.uid()))
  with check (bucket_id = 'news' and public.is_admin_or_instructor(auth.uid()));

drop policy if exists "news bucket: staff delete" on storage.objects;
create policy "news bucket: staff delete"
  on storage.objects for delete
  using (bucket_id = 'news' and public.is_admin_or_instructor(auth.uid()));
