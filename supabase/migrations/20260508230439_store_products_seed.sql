-- Seed the store_products + store_variants tables with the current
-- code-defined catalog (src/lib/site-data.ts STORE_ITEMS and
-- src/lib/store/catalog.ts CATALOG). After Phase 2 swaps reads to
-- the DB, the public site renders identical content because this
-- seed mirrors the constants exactly — same SKUs, same prices, same
-- size charts, same descriptions.
--
-- Idempotent via on conflict (slug / sku) do nothing — running this
-- against a populated DB is a no-op.

-- =============================================================================
-- PRODUCTS
-- =============================================================================

insert into public.store_products
  (slug, name, tagline, body, note, category, price_range_label,
   discount_label, discount_url, display_order)
values
  (
    'shirt',
    'WTC Shirt',
    'The uniform',
    'Required for all members — worn to practice and at events. Pre-shrunk, moisture-wicking, odor-fighting performance fabric. The shirt represents the equality of every player.',
    'Confirm your size — no exchanges.',
    'shirt',
    'Included with registration',
    null, null,
    10
  ),
  (
    'jacket-ladies',
    'Sport-Wick Fleece Jacket — Ladies',
    'For events',
    '8-ounce, 100% polyester moisture-wicking fleece. Cadet collar, set-in sleeves, slash pockets, self-fabric cuffs and hem. Embroidered Woodlands Tai Chi logo. Special order.',
    null,
    'jacket-ladies',
    '$66 – $85',
    null, null,
    20
  ),
  (
    'jacket-mens',
    'Sport-Wick Fleece Jacket — Men',
    'For events',
    '8-ounce, 100% polyester moisture-wicking fleece. Cadet collar, set-in sleeves, slash pockets, self-fabric cuffs and hem. Embroidered Woodlands Tai Chi logo. Special order.',
    null,
    'jacket-mens',
    '$67 – $85',
    null, null,
    21
  ),
  (
    'fan',
    'WTC Fan with Pouch',
    'Used in fan forms',
    'Branded fan and matching pouch — used in the Fan and Fan-18 forms.',
    null,
    'fan',
    '$15',
    null, null,
    30
  ),
  (
    'uniform',
    'Tang Suit',
    'Special-order event uniform',
    'Worn for performances and special events. Special order only — speak to an instructor.',
    null,
    'uniform',
    '$52',
    null, null,
    40
  ),
  (
    'patch',
    'WTC Patch',
    'Embroidered logo patch',
    'Sew-on Woodlands Tai Chi logo patch.',
    null,
    'patch',
    '$10',
    null, null,
    50
  ),
  (
    'shoes',
    'Recommended Shoes',
    'Reference',
    'We don''t sell shoes, but we strongly recommend Feiyue (made specifically for Tai Chi, originating from Shanghai in the 1920s) or Fuego dance shoes. Look for: low ankle profile, no or minimal heel, no or limited traction.',
    null,
    'shoes',
    null,
    'Fuego — 10% off with code WOODLANDSTAICHI10',
    'https://fuegodance.com/discount/WOODLANDSTAICHI10',
    60
  )
on conflict (slug) do nothing;

-- =============================================================================
-- VARIANTS — preserve legacy SKUs verbatim (incl. quirky doubled spaces
-- and "Mediun" typo) so historical orders keep resolving.
-- =============================================================================

-- Shirts (with size-chart dimensions from STORE_ITEMS.shirt.sizes)
with p as (select id from public.store_products where slug = 'shirt')
insert into public.store_variants
  (product_id, sku, size, price_cents, length_inches, width_inches, display_order)
select p.id, sku, size, price_cents, length_inches, width_inches, ord
from p, (values
  ('1024', 'XS',  4500, 26.0, 18.0,  10),
  ('1000', 'S',   4700, 28.5, 20.0,  20),
  ('1004', 'M',   4900, 29.5, 21.5,  30),
  ('1005', 'L',   5000, 30.5, 23.0,  40),
  ('1006', 'XL',  5300, 31.5, 24.5,  50),
  ('1001', '2XL', 5500, 32.5, 26.0,  60),
  ('1002', '3XL', 6000, 33.0, 28.0,  70),
  ('1003', '4XL', 6500, 33.5, 30.0,  80)
) as v(sku, size, price_cents, length_inches, width_inches, ord)
on conflict (sku) do nothing;

-- Ladies jackets
with p as (select id from public.store_products where slug = 'jacket-ladies')
insert into public.store_variants
  (product_id, sku, size, price_cents, display_order)
select p.id, sku, size, price_cents, ord
from p, (values
  ('1008', 'XS',  6600, 10),
  ('1009', 'S',   6700, 20),
  ('1010', 'M',   6900, 30),
  ('1011', 'L',   7200, 40),
  ('1012', 'XL',  7500, 50),
  ('1013', '2XL', 7800, 60),
  ('1014', '3XL', 8000, 70),
  ('1015', '4XL', 8500, 80)
) as v(sku, size, price_cents, ord)
on conflict (sku) do nothing;

-- Mens jackets — note 2XL is $73 in the legacy form (the seed
-- preserves that quirk verbatim; admin can correct in the UI later).
with p as (select id from public.store_products where slug = 'jacket-mens')
insert into public.store_variants
  (product_id, sku, size, price_cents, display_order)
select p.id, sku, size, price_cents, ord
from p, (values
  ('1016', 'S',   6700, 20),
  ('1017', 'M',   6900, 30),
  ('1018', 'L',   7500, 40),
  ('1019', 'XL',  7800, 50),
  ('1020', '2XL', 7300, 60),
  ('1021', '3XL', 8000, 70),
  ('1022', '4XL', 8500, 80)
) as v(sku, size, price_cents, ord)
on conflict (sku) do nothing;

-- Fans
with p as (select id from public.store_products where slug = 'fan')
insert into public.store_variants
  (product_id, sku, size, price_cents, display_order)
select p.id, sku, size, price_cents, ord
from p, (values
  ('1007', 'Red',         1500, 10),
  ('1025', 'WTC w/pouch', 1500, 20)
) as v(sku, size, price_cents, ord)
on conflict (sku) do nothing;

-- Uniform
with p as (select id from public.store_products where slug = 'uniform')
insert into public.store_variants
  (product_id, sku, size, price_cents, display_order)
select p.id, sku, null::text as size, price_cents, ord
from p, (values
  ('1023', 5200, 10)
) as v(sku, price_cents, ord)
on conflict (sku) do nothing;

-- Patch
with p as (select id from public.store_products where slug = 'patch')
insert into public.store_variants
  (product_id, sku, size, price_cents, display_order)
select p.id, sku, null::text as size, price_cents, ord
from p, (values
  ('1026', 1000, 10)
) as v(sku, price_cents, ord)
on conflict (sku) do nothing;

-- Shoes intentionally has no variants — discount link only.
