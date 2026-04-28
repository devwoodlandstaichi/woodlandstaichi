import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "./order-form";

export const metadata: Metadata = {
  title: "Place an order — Woodlands Tai Chi",
  description:
    "Order WTC shirts, fans, jackets, the Tang Suit uniform, or a patch. Pickup at class — pay via Zelle, Apple Cash, PayPal, or Venmo.",
};

export const dynamic = "force-static";

export default function OrderPage() {
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
          <OrderForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
