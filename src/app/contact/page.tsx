import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Woodlands Tai Chi",
  description:
    "Send a message to Woodlands Tai Chi. Questions about classes, schedules, or registration — we'll reply by email.",
};

export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Get in touch"
          title="Send"
          italic="us a note."
          intro="Questions about classes, scheduling, or registration? Write to us — we read every message."
          glyph="信"
        />

        <section
          aria-labelledby="contact-form-heading"
          className="relative"
        >
          {/* Vertical CJK column — hangs down the page's left margin
              like a scroll mark. 信 (letter) · 来 (come) · 和 (harmony).
              Decorative; hidden under lg to keep the form full-width. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 hidden lg:flex items-start justify-center pt-24"
            style={{ width: "min(6rem, 7vw)" }}
          >
            <span
              className="vertical-mark text-[1.35rem] text-foreground/40 select-none"
              style={{ letterSpacing: "0.7em" }}
            >
              信来和
            </span>
          </div>

          <div className="mx-auto max-w-5xl px-6 py-8 md:py-12 lg:pl-24">
            <div className="grid gap-10 md:grid-cols-12 md:gap-x-10">
              <div className="md:col-span-8">
                <h2 id="contact-form-heading" className="sr-only">
                  Send a message
                </h2>
                <ContactForm />
              </div>

              <aside
                className="md:col-span-4 rise"
                style={{ animationDelay: "240ms" }}
              >
                <div className="md:sticky md:top-24 flex flex-col gap-9 md:pl-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                      <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                      From the school
                    </p>
                    <p className="font-display italic text-foreground/70 leading-relaxed text-lg">
                      Phone is not always answered. Email or text reaches us
                      the fastest.
                    </p>
                  </div>

                  {/* Letterhead-style contact lines.
                      Mono eyebrow + display address — reads as a return
                      address block on stationery, not as a UI tile. */}
                  <ul className="flex flex-col gap-7">
                    <li>
                      <a
                        href="mailto:info@woodlandstaichi.com"
                        className="group block"
                      >
                        <span className="block font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/50 mb-2">
                          <span className="text-vermillion">↳</span> Email
                        </span>
                        <span className="block font-display text-[1.35rem] leading-tight tracking-tight break-all group-hover:text-vermillion transition-colors">
                          info@woodlandstaichi.com
                        </span>
                      </a>
                    </li>
                    <li>
                      <a href="sms:8323816078" className="group block">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/50 mb-2">
                          <span className="text-cobalt">↳</span> Text · English only
                        </span>
                        <span className="block font-display text-[1.35rem] tabular-nums leading-tight tracking-tight group-hover:text-vermillion transition-colors">
                          (832) 381-6078
                        </span>
                      </a>
                    </li>
                  </ul>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/50 mb-3">
                      <span className="text-jade">↳</span> Visit
                    </p>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      Class locations &amp; times on the{" "}
                      <Link
                        href="/classes"
                        className="underline decoration-vermillion underline-offset-4 hover:text-vermillion transition-colors"
                      >
                        schedule
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            {/* Closing bookend — same vocabulary as /about/why's
                ceremonial section dividers. Small ◆ flanked by
                centre-fading rules. */}
            <div
              className="mt-16 md:mt-20 flex items-center justify-center gap-5 fade"
              style={{ animationDelay: "480ms" }}
            >
              <span className="rule w-32 md:w-48" />
              <span aria-hidden className="text-vermillion text-xs">
                ◆
              </span>
              <span className="rule w-32 md:w-48" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
