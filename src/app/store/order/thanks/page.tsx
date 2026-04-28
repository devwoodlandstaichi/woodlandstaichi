import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Order received — Woodlands Tai Chi",
};

export default function OrderThanksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <section className="mx-auto max-w-3xl px-6 py-14 md:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Received
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
            Thank you.
            <span className="block italic text-vermillion">Your order is in.</span>
          </h1>
          <div className="mt-8 space-y-5 text-lg text-foreground/85 leading-relaxed">
            <p>
              We&apos;ll confirm your order by email within a few days, along
              with payment details and pickup instructions. Shirts and jackets
              are special-order, so allow up to four weeks.
            </p>
            <p className="text-base text-foreground/65 italic">
              If you don&apos;t hear back, please email{" "}
              <a
                href="mailto:info@woodlandstaichi.com"
                className="text-vermillion hover:underline"
              >
                info@woodlandstaichi.com
              </a>
              .
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/store"
              className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
            >
              Back to the store
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background hover:-translate-y-0.5 transition-transform"
            >
              Home →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
