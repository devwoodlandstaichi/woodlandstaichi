import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { fetchActiveStoreProducts } from "@/lib/store/db";
import { formatUsd } from "@/lib/store/catalog";

export const metadata: Metadata = {
  title: "Store — uniforms, jackets, fans, shoes",
  description:
    "WTC shirts, fleece jackets, Tang Suit uniforms, fans, and recommended Tai Chi shoes for Woodlands Tai Chi members.",
};

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const products = await fetchActiveStoreProducts();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Store"
          title="The uniform"
          italic="and a little more."
          intro="The WTC shirt is required for all members. Everything else is optional. We don't process payments here yet — order via the linked forms or speak to an instructor."
          glyph="服"
        />

        <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
          <ul className="space-y-8">
            {products.map((item) => {
              // Shirts have variants with size-chart dimensions; render
              // the chart with prices. Other products with variants
              // render a simple per-size price list. Products with no
              // variants (Recommended Shoes) show the price-range
              // label only.
              const hasDimensions = item.variants.some(
                (v) => v.length_inches !== null && v.width_inches !== null,
              );
              const hasVariants = item.variants.length > 0;

              return (
                <li
                  key={item.slug}
                  id={item.slug}
                  className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-foreground/10 pt-8"
                >
                  <div className="col-span-12 md:col-span-4">
                    {item.image_url && (
                      <div className="mb-5 overflow-hidden rounded-xl border border-foreground/10 bg-secondary/40 aspect-square">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={400}
                          height={400}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {item.tagline && (
                      <p className="text-xs uppercase tracking-[0.3em] text-foreground/55">
                        {item.tagline}
                      </p>
                    )}
                    <h2 className="mt-2 font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
                      {item.name}
                    </h2>
                    {item.price_range_label && (
                      <p className="mt-6 text-base text-vermillion-600 font-medium">
                        {item.price_range_label}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-8 md:pl-8 space-y-6">
                    {item.body && (
                      <p className="text-lg text-foreground/85 leading-relaxed">
                        {item.body}
                      </p>
                    )}

                    {hasVariants && hasDimensions && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-foreground/55 mb-3">
                          Size chart (inches) &amp; pricing
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-foreground/10">
                          <table className="w-full text-sm">
                            <thead className="bg-secondary">
                              <tr>
                                <th className="text-left p-3 font-medium">Size</th>
                                <th className="text-left p-3 font-medium">Length</th>
                                <th className="text-left p-3 font-medium">Width</th>
                                <th className="text-right p-3 font-medium">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.variants.map((v) => (
                                <tr
                                  key={v.id}
                                  className="border-t border-foreground/8"
                                >
                                  <td className="p-3 font-medium">
                                    {v.size ?? "—"}
                                  </td>
                                  <td className="p-3 tabular-nums">
                                    {v.length_inches !== null
                                      ? `${v.length_inches}″`
                                      : "—"}
                                  </td>
                                  <td className="p-3 tabular-nums">
                                    {v.width_inches !== null
                                      ? `${v.width_inches}″`
                                      : "—"}
                                  </td>
                                  <td className="p-3 text-right font-mono tabular-nums text-foreground/80">
                                    {formatUsd(v.price_cents)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {item.note && (
                          <p className="mt-3 text-sm text-vermillion-600 italic">
                            {item.note}
                          </p>
                        )}
                      </div>
                    )}

                    {hasVariants && !hasDimensions && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-foreground/55 mb-3">
                          Sizes &amp; pricing
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                          {item.variants.map((v) => (
                            <li
                              key={v.id}
                              className="flex items-baseline justify-between border-b border-foreground/8 pb-2"
                            >
                              <span className="text-sm">
                                {v.size ?? "—"}
                              </span>
                              <span className="font-mono tabular-nums text-foreground/80">
                                {formatUsd(v.price_cents)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {item.note && (
                          <p className="mt-3 text-sm text-vermillion-600 italic">
                            {item.note}
                          </p>
                        )}
                      </div>
                    )}

                    {item.discount_url && item.discount_label && (
                      <a
                        href={item.discount_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-vermillion/30 bg-vermillion/5 px-5 py-2.5 text-sm font-medium text-vermillion-600 hover:bg-vermillion/10 transition-colors"
                      >
                        {item.discount_label}
                        <span aria-hidden>↗</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-12 rounded-2xl border border-foreground/10 bg-secondary p-8 md:p-10">
            <h3 className="font-display text-3xl md:text-4xl tracking-tight">
              How to order
            </h3>
            <p className="mt-4 text-lg text-foreground/80 leading-relaxed max-w-2xl">
              Pick your sizes, submit the order form, and we&apos;ll confirm
              by email within a few days. Pay via Zelle, Apple Cash, PayPal,
              or Venmo — pickup at class. Shirts and jackets are special
              order, so allow up to four weeks.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/store/order"
                className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
              >
                Place an order →
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
              >
                Questions? Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
