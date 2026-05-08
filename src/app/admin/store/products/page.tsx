import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { formatUsd } from "@/lib/store/catalog";

// PageHeader from admin/ui supports a helpTopic prop. Using "store"
// surfaces the help drawer next to + New product.

export const metadata = { title: "Store products" };
export const dynamic = "force-dynamic";

type Variant = {
  id: string;
  price_cents: number;
  active: boolean;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image_url: string | null;
  display_order: number;
  active: boolean;
  store_variants: Variant[];
};

const CATEGORY_LABEL: Record<string, string> = {
  shirt: "Shirt",
  "jacket-ladies": "Jacket — Ladies",
  "jacket-mens": "Jacket — Men",
  fan: "Fan",
  uniform: "Uniform",
  patch: "Patch",
  shoes: "Shoes",
};

export default async function StoreProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select(
      "id,slug,name,category,image_url,display_order,active,store_variants(id,price_cents,active)",
    )
    .order("display_order", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Store products"
        description="Marketing cards on /store + per-size variants used by /store/order."
        helpTopic="store"
        action={
          <Link
            href="/admin/store/products/new"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={14} aria-hidden /> New product
          </Link>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-4">
        {rows.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-muted-foreground">
            No products yet. Click <strong>+ New product</strong>.
          </Card>
        ) : (
          <ul className="grid gap-3">
            {rows.map((p) => {
              const activeVariants = p.store_variants.filter((v) => v.active);
              const min =
                activeVariants.length > 0
                  ? Math.min(...activeVariants.map((v) => v.price_cents))
                  : null;
              const max =
                activeVariants.length > 0
                  ? Math.max(...activeVariants.map((v) => v.price_cents))
                  : null;
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/store/products/${p.id}/edit`}
                    className="flex items-center gap-4 rounded-xl border border-foreground/10 bg-card p-4 transition-colors hover:border-foreground/30"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary/40 flex items-center justify-center">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt=""
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          No photo
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {CATEGORY_LABEL[p.category] ?? p.category}
                        {" · "}
                        <span className="font-mono">/{p.slug}</span>
                        {" · "}
                        {p.store_variants.length}{" "}
                        {p.store_variants.length === 1
                          ? "variant"
                          : "variants"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {min !== null && max !== null ? (
                        <span className="font-mono text-sm tabular-nums text-foreground/80">
                          {min === max
                            ? formatUsd(min)
                            : `${formatUsd(min)} – ${formatUsd(max)}`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                      <Badge tone={p.active ? "jade" : "muted"}>
                        {p.active ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
