import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { fetchActiveStoreProducts } from "@/lib/store/db";
import { OrderForm, type OrderFormProduct } from "./order-form";

export const metadata: Metadata = {
  title: "Place an order — Woodlands Tai Chi",
  description:
    "Order WTC shirts, fans, jackets, the Tang Suit uniform, or a patch. Pickup at class — pay via Zelle, Apple Cash, PayPal, or Venmo.",
};

export const dynamic = "force-dynamic";

export default async function OrderPage() {
  // Fetch products + variants from the DB and pass to the client form.
  // Skip products without variants (e.g. Recommended Shoes — they have
  // a discount link but nothing to add to a cart).
  const products = await fetchActiveStoreProducts();
  const orderable: OrderFormProduct[] = products
    .filter((p) => p.variants.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category_label: categoryLabel(p.category),
      variants: p.variants.map((v) => ({
        sku: v.sku,
        size: v.size,
        price_cents: v.price_cents,
      })),
    }));

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Store"
          title="Place"
          italic="an order."
          intro="Shirts, fans, jackets, and the Tang Suit are pickup-only at class. Submit your order and we'll confirm by email within a few days."
          glyph="服"
        />

        <section className="mx-auto max-w-3xl px-6 py-3 md:py-5">
          <OrderForm products={orderable} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// Group label shown above the per-product list of sizes on the order
// form. Mirrors the labels members saw under the legacy CATALOG.
function categoryLabel(category: string): string {
  switch (category) {
    case "shirt":
      return "WTC Shirt";
    case "jacket-ladies":
      return "Sport-Wick Jacket — Ladies";
    case "jacket-mens":
      return "Sport-Wick Jacket — Men";
    case "fan":
      return "Fans";
    case "uniform":
      return "Tang Suit Uniform";
    case "patch":
      return "WTC Patch";
    default:
      return category;
  }
}
