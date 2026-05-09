import "server-only";
import { createClient } from "@/lib/supabase/server";

// Server-side helpers for reading the store_products + store_variants
// tables. Used by /store, /store/order, and the order-submission action.
// Keeps the Supabase query shape in one place so consumers don't each
// repeat the active-flag filtering logic.

export type StoreVariantRow = {
  id: string;
  sku: string;
  size: string | null;
  price_cents: number;
  length_inches: number | null;
  width_inches: number | null;
  display_order: number;
};

export type StoreProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  body: string | null;
  note: string | null;
  category: string;
  image_url: string | null;
  price_range_label: string | null;
  discount_label: string | null;
  discount_url: string | null;
  display_order: number;
  variants: StoreVariantRow[];
};

type RawProductRow = Omit<StoreProductRow, "variants"> & {
  store_variants: (StoreVariantRow & { active: boolean })[];
};

/** Active products (and their active variants) ordered for public
 * display. Inactive rows are hidden — admin uses a different read
 * path that includes everything. */
export async function fetchActiveStoreProducts(): Promise<StoreProductRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select(
      "id,slug,name,tagline,body,note,category,image_url,price_range_label,discount_label,discount_url,display_order,store_variants(id,sku,size,price_cents,length_inches,width_inches,display_order,active)",
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  const rows = (data ?? []) as unknown as RawProductRow[];
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    body: p.body,
    note: p.note,
    category: p.category,
    image_url: p.image_url,
    price_range_label: p.price_range_label,
    discount_label: p.discount_label,
    discount_url: p.discount_url,
    display_order: p.display_order,
    variants: p.store_variants
      .filter((v) => v.active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(({ active: _, ...rest }) => {
        void _;
        return rest;
      }),
  }));
}

/** Resolve a list of SKUs to current variant pricing + product
 * context. Used by /store/order/actions.ts at submission time so the
 * order_items rows snapshot the price the customer actually saw —
 * even if it changes a minute later. */
export type ResolvedVariant = {
  sku: string;
  product_name: string;
  size: string | null;
  price_cents: number;
};

export async function fetchVariantsBySkus(
  skus: string[],
): Promise<Map<string, ResolvedVariant>> {
  if (skus.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_variants")
    .select(
      "sku,size,price_cents,store_products!inner(name,active)",
    )
    .in("sku", skus)
    .eq("active", true);

  type RawJoin = {
    sku: string;
    size: string | null;
    price_cents: number;
    store_products: { name: string; active: boolean } | { name: string; active: boolean }[] | null;
  };
  const rows = (data ?? []) as unknown as RawJoin[];

  const out = new Map<string, ResolvedVariant>();
  for (const r of rows) {
    const product = Array.isArray(r.store_products)
      ? r.store_products[0]
      : r.store_products;
    if (!product || !product.active) continue;
    out.set(r.sku, {
      sku: r.sku,
      product_name: product.name,
      size: r.size,
      price_cents: r.price_cents,
    });
  }
  return out;
}

/** Compose a human-friendly line-item name for an order. Used at
 * submission time to populate order_items.name with something like
 * "WTC Shirt — Medium" instead of relying on the legacy combined
 * names that lived in CATALOG. */
export function composeLineItemName(v: ResolvedVariant): string {
  return v.size ? `${v.product_name} — ${v.size}` : v.product_name;
}
