-- Store products + variants — Phase 1 of the dynamic store rollout.
--
-- Until now /store and /store/order both read from code constants
-- (src/lib/site-data.ts STORE_ITEMS and src/lib/store/catalog.ts
-- CATALOG respectively). Two sources of truth for what's effectively
-- one product database, neither with photos. This migration is purely
-- additive — code keeps reading the constants for now. Phase 2 (a
-- separate commit) flips the reads to use these tables.
--
-- Shape: products carry the marketing copy + photo; variants carry the
-- transactional rows (one per SKU). Cents are stored as int to match
-- the existing orders.subtotal_cents pattern. Legacy SKU strings from
-- catalog.ts are preserved verbatim so historical orders still resolve.

create type store_product_category as enum (
  'shirt',
  'jacket-ladies',
  'jacket-mens',
  'fan',
  'uniform',
  'patch',
  'shoes'
);

create table public.store_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  body text,
  note text,
  category store_product_category not null,
  -- Photo lives in Storage bucket 'store-products'; we keep both the
  -- public URL (for rendering) and the path (for replace/delete) so
  -- the same pattern as news + instructor photos applies here.
  image_url text,
  image_path text,
  -- Free-text price label for cards where per-variant pricing isn't
  -- meaningful (e.g. "Included with registration", "Special order",
  -- or the affiliate-only shoes recommendation). Variant prices
  -- override this when present.
  price_range_label text,
  discount_label text,
  discount_url text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_products_active_order_idx
  on public.store_products (display_order)
  where active = true;
create index store_products_category_idx on public.store_products (category);

create trigger set_updated_at_store_products
  before update on public.store_products
  for each row execute function public.set_updated_at();

alter table public.store_products enable row level security;

create policy "anyone reads active store products"
  on public.store_products for select
  using (active = true);

create policy "staff manage store products"
  on public.store_products for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Variants — one row per SKU. A product like "WTC Shirt" has eight
-- variants (XS through 4XL). Shoes / recommendation-only products
-- have zero variants.
create table public.store_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.store_products(id) on delete cascade,
  sku text unique not null,
  size text,
  price_cents int not null,
  -- Optional dimensions for the size chart on /store. Numeric so
  -- "30.5" works for shirts.
  length_inches numeric(5, 2),
  width_inches numeric(5, 2),
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_variants_product_idx
  on public.store_variants (product_id, display_order);

create trigger set_updated_at_store_variants
  before update on public.store_variants
  for each row execute function public.set_updated_at();

alter table public.store_variants enable row level security;

-- Public can see active variants of active products.
create policy "anyone reads active store variants"
  on public.store_variants for select
  using (
    active = true
    and exists (
      select 1 from public.store_products p
      where p.id = product_id and p.active = true
    )
  );

create policy "staff manage store variants"
  on public.store_variants for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

-- Storage bucket for product photos. Public-read so /store can render
-- without auth; staff-write via the admin client.
insert into storage.buckets (id, name, public)
values ('store-products', 'store-products', true)
on conflict do nothing;

drop policy if exists "store-products bucket: public read" on storage.objects;
create policy "store-products bucket: public read"
  on storage.objects for select
  using (bucket_id = 'store-products');

drop policy if exists "store-products bucket: staff insert" on storage.objects;
create policy "store-products bucket: staff insert"
  on storage.objects for insert
  with check (
    bucket_id = 'store-products'
    and public.is_admin_or_instructor(auth.uid())
  );

drop policy if exists "store-products bucket: staff update" on storage.objects;
create policy "store-products bucket: staff update"
  on storage.objects for update
  using (bucket_id = 'store-products' and public.is_admin_or_instructor(auth.uid()))
  with check (bucket_id = 'store-products' and public.is_admin_or_instructor(auth.uid()));

drop policy if exists "store-products bucket: staff delete" on storage.objects;
create policy "store-products bucket: staff delete"
  on storage.objects for delete
  using (bucket_id = 'store-products' and public.is_admin_or_instructor(auth.uid()));
