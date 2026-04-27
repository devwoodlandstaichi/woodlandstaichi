import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { STORE_ITEMS } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Store — uniforms, jackets, fans, shoes",
  description:
    "WTC shirts, fleece jackets, Tang Suit uniforms, fans, and recommended Tai Chi shoes for Woodlands Tai Chi members.",
};

export default function StorePage() {
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

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <ul className="space-y-12">
            {STORE_ITEMS.map((item) => (
              <li
                key={item.slug}
                id={item.slug}
                className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-foreground/10 pt-12"
              >
                <div className="col-span-12 md:col-span-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-foreground/55">
                    {item.tagline}
                  </p>
                  <h2 className="mt-2 font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
                    {item.name}
                  </h2>
                  <p className="mt-6 text-base text-vermillion-600 font-medium">
                    {item.priceRange}
                  </p>
                </div>

                <div className="col-span-12 md:col-span-8 md:pl-8 space-y-6">
                  <p className="text-lg text-foreground/85 leading-relaxed">
                    {item.body}
                  </p>

                  {"sizes" in item && item.sizes && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/55 mb-3">
                        Size chart (inches)
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-foreground/10">
                        <table className="w-full text-sm">
                          <thead className="bg-secondary">
                            <tr>
                              <th className="text-left p-3 font-medium">Size</th>
                              <th className="text-left p-3 font-medium">Length</th>
                              <th className="text-left p-3 font-medium">Width</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.sizes.map((s) => (
                              <tr key={s.size} className="border-t border-foreground/8">
                                <td className="p-3 font-medium">{s.size}</td>
                                <td className="p-3 tabular-nums">{s.length}″</td>
                                <td className="p-3 tabular-nums">{s.width}″</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {"note" in item && item.note && (
                        <p className="mt-3 text-sm text-vermillion-600 italic">
                          {item.note}
                        </p>
                      )}
                    </div>
                  )}

                  {"pricing" in item && item.pricing && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-foreground/55 mb-3">
                        Sizes &amp; pricing
                      </p>
                      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                        {item.pricing.map((p) => (
                          <li
                            key={p.size}
                            className="flex items-baseline justify-between border-b border-foreground/8 pb-2"
                          >
                            <span className="text-sm">{p.size}</span>
                            <span className="font-mono tabular-nums text-foreground/80">
                              ${p.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {"discount" in item && item.discount && (
                    <a
                      href={item.discount.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-vermillion/30 bg-vermillion/5 px-5 py-2.5 text-sm font-medium text-vermillion-600 hover:bg-vermillion/10 transition-colors"
                    >
                      {item.discount.label}
                      <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-20 rounded-2xl border border-foreground/10 bg-secondary p-10 md:p-14">
            <h3 className="font-display text-3xl md:text-4xl tracking-tight">
              How to order
            </h3>
            <p className="mt-4 text-lg text-foreground/80 leading-relaxed max-w-2xl">
              For shirts, fans, and special-order items: use the JotForm we
              already have, or speak to an instructor. Payment via Zelle,
              Venmo, Apple Pay, or PayPal. A built-in store and form will
              replace JotForm in a later phase.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background hover:-translate-y-0.5 transition-transform"
              >
                Email us →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
