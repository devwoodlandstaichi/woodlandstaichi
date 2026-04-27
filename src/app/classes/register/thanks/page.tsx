import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Thank you — registration received",
};

export default function ThanksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <section className="mx-auto max-w-3xl px-6 py-24 md:py-32 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Received
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight">
            Thank you.
            <span className="block italic text-vermillion">We&apos;ve got you.</span>
          </h1>
          <div className="mt-12 space-y-5 text-lg text-foreground/85 leading-relaxed">
            <p>
              Your registration has been recorded. We&apos;ll send a follow-up
              email shortly with shirt payment instructions and a confirmation
              of your cohort and session.
            </p>
            <p>
              You aren&apos;t fully enrolled until payment is received — once
              the shirt fee lands, your spot moves from waitlist to active.
            </p>
            <p className="text-base text-foreground/65 italic">
              If you don&apos;t hear back within a couple of days, please email{" "}
              <a
                href="mailto:info@woodlandstaichi.com"
                className="text-vermillion hover:underline"
              >
                info@woodlandstaichi.com
              </a>{" "}
              — sometimes spam filters get assertive.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/classes"
              className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
            >
              Back to classes
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background hover:-translate-y-0.5 transition-transform"
            >
              About the practice →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
