import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../../product-form";
import {
  VariantsEditor,
  type VariantRow,
} from "../../variants-editor";
import { deleteProduct, updateProduct } from "../../actions";

export const metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

type Variant = {
  id: string;
  sku: string;
  size: string | null;
  price_cents: number;
  length_inches: number | null;
  width_inches: number | null;
  display_order: number;
  active: boolean;
};

type Product = {
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
  active: boolean;
  store_variants: Variant[];
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select(
      "id,slug,name,tagline,body,note,category,image_url,price_range_label,discount_label,discount_url,display_order,active,store_variants(id,sku,size,price_cents,length_inches,width_inches,display_order,active)",
    )
    .eq("id", id)
    .maybeSingle();

  const p = (data ?? null) as unknown as Product | null;
  if (!p) notFound();

  const action = updateProduct.bind(null, p.id);

  const initialVariants: VariantRow[] = [...p.store_variants]
    .sort((a, b) => a.display_order - b.display_order)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size ?? "",
      price_dollars: (v.price_cents / 100).toFixed(2),
      length_inches: v.length_inches !== null ? String(v.length_inches) : "",
      width_inches: v.width_inches !== null ? String(v.width_inches) : "",
      display_order: String(v.display_order),
      active: v.active,
    }));

  // Show length/width columns on shirts only — they're the only
  // category that has a public-facing size chart with dimensions.
  const showDimensions = p.category === "shirt";

  return (
    <>
      <PageHeader
        title={`Edit ${p.name}`}
        description="Marketing copy, photo, and per-size variants. Saving variants is a separate button — they reconcile as a batch."
        back="/admin/store/products"
        action={
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={p.id} />
            <Button type="submit" variant="outline" size="sm">
              Delete
            </Button>
          </form>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6 space-y-8">
        <ProductForm
          action={action}
          defaults={{
            slug: p.slug,
            name: p.name,
            tagline: p.tagline,
            body: p.body,
            note: p.note,
            category: p.category,
            price_range_label: p.price_range_label,
            discount_label: p.discount_label,
            discount_url: p.discount_url,
            display_order: p.display_order,
            active: p.active,
            image_url: p.image_url,
          }}
          submitLabel="Save product"
          cancelHref="/admin/store/products"
        />

        <VariantsEditor
          productId={p.id}
          initial={initialVariants}
          showDimensions={showDimensions}
        />
      </div>
    </>
  );
}
