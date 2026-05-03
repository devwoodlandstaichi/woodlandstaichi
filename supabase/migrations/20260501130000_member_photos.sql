-- Member photos.
--
-- members.photo_url already exists (added in 20260428300000_member_bio).
-- Add photo_path so the upload action can clean up the previous file
-- when a member's photo is replaced or removed — same pattern as
-- news_posts.cover_image_path / instructors.photo_path.

alter table public.members
  add column if not exists photo_path text;

-- Bucket: public read so <Image> can render without signed URLs.
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

-- Storage RLS — staff (admins/instructors) write; everyone reads.
-- The upload action also uses the service-role client, so writes still
-- work if these policies drift; the policies exist so the Studio UI
-- and SQL-level resets behave correctly.

drop policy if exists "member-photos bucket: public read" on storage.objects;
create policy "member-photos bucket: public read"
  on storage.objects for select
  using (bucket_id = 'member-photos');

drop policy if exists "member-photos bucket: staff insert" on storage.objects;
create policy "member-photos bucket: staff insert"
  on storage.objects for insert
  with check (
    bucket_id = 'member-photos' and public.is_admin_or_instructor(auth.uid())
  );

drop policy if exists "member-photos bucket: staff update" on storage.objects;
create policy "member-photos bucket: staff update"
  on storage.objects for update
  using (
    bucket_id = 'member-photos' and public.is_admin_or_instructor(auth.uid())
  )
  with check (
    bucket_id = 'member-photos' and public.is_admin_or_instructor(auth.uid())
  );

drop policy if exists "member-photos bucket: staff delete" on storage.objects;
create policy "member-photos bucket: staff delete"
  on storage.objects for delete
  using (
    bucket_id = 'member-photos' and public.is_admin_or_instructor(auth.uid())
  );
