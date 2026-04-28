-- Store orders — replaces JotForm 200158184612146.
-- Customers submit anonymously; staff manage via /admin/orders.

create type order_payment_method as enum ('zelle', 'apple_cash', 'paypal', 'venmo');
create type order_payment_status as enum ('unpaid', 'paid', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Customer (free-text — we do NOT require a member row)
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  member_id uuid references public.members(id) on delete set null,
  -- Pricing (cents to avoid float)
  subtotal_cents int not null default 0,
  service_fee_cents int not null default 0,
  total_cents int not null default 0,
  -- Order metadata
  order_date date not null default current_date,
  payment_method order_payment_method not null,
  payment_status order_payment_status not null default 'unpaid',
  paid_at timestamptz,
  notes text,
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ip text,
  user_agent text
);

create index orders_status_idx on public.orders (payment_status, created_at desc);
create index orders_email_idx on public.orders (customer_email);
create index orders_member_idx on public.orders (member_id) where member_id is not null;

create trigger set_updated_at_orders before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text not null,            -- legacy id like '1024' / 'WTC-SHIRT-XS'
  name text not null,           -- 'WTC Shirt X Small'
  unit_cents int not null,
  quantity int not null default 1 check (quantity > 0),
  line_cents int not null,
  display_order int not null default 0
);

create index order_items_order_idx on public.order_items (order_id);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public submissions: anyone may insert an order + its items, but cannot read.
create policy "anyone may submit orders"
  on public.orders for insert
  with check (true);

create policy "anyone may insert order items"
  on public.order_items for insert
  with check (true);

-- Staff full CRUD.
create policy "staff manage orders"
  on public.orders for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));

create policy "staff manage order items"
  on public.order_items for all
  using (public.is_admin_or_instructor(auth.uid()))
  with check (public.is_admin_or_instructor(auth.uid()));
