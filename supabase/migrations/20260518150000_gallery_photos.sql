-- Admin-managed public gallery.
--
-- Before this migration the /gallery page rendered from a hardcoded
-- GALLERY_PHOTOS array in src/lib/site-data.ts, with files sitting in
-- public/photos/. Every photo change required a git commit + Vercel
-- redeploy. This moves photos behind an admin CRUD: rows in
-- gallery_photos + files in the new `gallery` Storage bucket, same
-- pattern as news cover images and instructor portraits.
--
-- Legacy rows (the 11 photos seeded below) keep their /photos/ URL
-- and have image_path = null, so the public page never goes blank
-- during cutover. Admins can delete + re-upload to migrate each one
-- into the bucket; once all rows have an image_path, the old files
-- in public/photos/ can be pruned.

create table public.gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  -- Path within the gallery bucket. Null for legacy /photos/ entries.
  image_path   text,
  alt          text not null default '',
  -- 'landscape' (4/3) or 'portrait' (3/4). Drives the masonry tile
  -- aspect on /gallery — keeps the column layout from breaking when a
  -- mix of orientations is uploaded.
  aspect       text not null default 'landscape'
                 check (aspect in ('landscape', 'portrait')),
  -- Smaller sort_order surfaces first. New uploads land at the top
  -- (0) by default; reorder buttons shift neighbours.
  sort_order   integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index gallery_photos_sort_idx
  on public.gallery_photos (active, sort_order asc, created_at desc);

create trigger gallery_photos_set_updated_at
  before update on public.gallery_photos
  for each row execute function public.set_updated_at();

alter table public.gallery_photos enable row level security;

create policy "anyone reads active gallery photos"
  on public.gallery_photos for select
  using (active = true);

create policy "staff manage gallery photos"
  on public.gallery_photos for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Public bucket. 5 MB per file matches the server-side cap; client
-- downscales most uploads to well under 1 MB before they hit here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "anyone reads gallery photos"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "staff upload gallery photos"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery'
    and public.is_admin_or_instructor(auth.uid())
  );

create policy "staff update gallery photos"
  on storage.objects for update
  using (
    bucket_id = 'gallery'
    and public.is_admin_or_instructor(auth.uid())
  );

create policy "staff delete gallery photos"
  on storage.objects for delete
  using (
    bucket_id = 'gallery'
    and public.is_admin_or_instructor(auth.uid())
  );

-- Seed the existing hardcoded photos. image_path is null because
-- the files live in public/photos/, not the bucket.
insert into public.gallery_photos (image_url, alt, aspect, sort_order)
values
  ('/photos/WTCD2023-9.jpg',                                'World Tai Chi Day 2023 — group practice',  'landscape', 10),
  ('/photos/WTCD2023-26.jpg',                               'World Tai Chi Day 2023 — group photo',     'landscape', 20),
  ('/photos/WTCD2023-8.jpg',                                'World Tai Chi Day 2023 — outdoor session', 'landscape', 30),
  ('/photos/FloMKS-WTachiDay2019-10.jpg',                   'Tai Chi Day 2019 — practice',              'landscape', 40),
  ('/photos/DSC_7640-XL.jpg',                               'Group practice',                           'landscape', 50),
  ('/photos/2025-04-26_09-59-53_098.jpeg',                  'World Tai Chi Day 2025',                   'portrait',  60),
  ('/photos/2025-04-26_10-00-58_416.jpeg',                  'World Tai Chi Day 2025 — practice',        'portrait',  70),
  ('/photos/cf0234_00d752fa25d644689737dec821ab9430mv2.webp','Class group photo',                       'landscape', 80),
  ('/photos/cf0234_2c906e57203745bc81c0b15969df9d81mv2.webp','Class practice',                          'landscape', 90),
  ('/photos/cf0234_84874345e89645d582b6decf2d412ffamv2.webp','Class practice',                          'landscape', 100),
  ('/photos/cf0234_e3e8a13c3072448495aac212e22cb0b5mv2.webp','Class practice',                          'landscape', 110);
