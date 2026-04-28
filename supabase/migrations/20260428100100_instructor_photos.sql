-- Photo support for instructors. Adds the column + a public storage
-- bucket so we can serve images at /storage/v1/object/public/...
-- without auth checks per request.

alter table public.instructors
  add column photo_url text;

-- Public bucket for instructor portraits. Anonymous read; staff write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('instructor-photos', 'instructor-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "anyone reads instructor photos"
  on storage.objects for select
  using (bucket_id = 'instructor-photos');

create policy "staff upload instructor photos"
  on storage.objects for insert
  with check (
    bucket_id = 'instructor-photos'
    and public.is_admin_or_instructor(auth.uid())
  );

create policy "staff update instructor photos"
  on storage.objects for update
  using (
    bucket_id = 'instructor-photos'
    and public.is_admin_or_instructor(auth.uid())
  );

create policy "staff delete instructor photos"
  on storage.objects for delete
  using (
    bucket_id = 'instructor-photos'
    and public.is_admin_or_instructor(auth.uid())
  );
