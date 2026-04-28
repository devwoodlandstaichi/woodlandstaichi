import type { Metadata } from "next";
import { Mail, MessageSquare } from "lucide-react";
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

        <section className="mx-auto max-w-5xl px-6 py-3 md:py-5">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <ContactForm />
            </div>

            <aside className="md:col-span-5 flex flex-col gap-4 md:pl-2">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Other ways
              </p>

              <a
                href="mailto:info@woodlandstaichi.com"
                className="group flex items-center gap-4 rounded-xl border border-foreground/10 bg-background/60 p-5 hover:border-vermillion/40 transition-colors"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vermillion/10 text-vermillion">
                  <Mail size={20} aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs uppercase tracking-[0.25em] text-foreground/55">
                    Email
                  </span>
                  <span className="block font-medium truncate">
                    info@woodlandstaichi.com
                  </span>
                </span>
              </a>

              <a
                href="sms:8323816078"
                className="group flex items-center gap-4 rounded-xl border border-foreground/10 bg-background/60 p-5 hover:border-vermillion/40 transition-colors"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <MessageSquare size={20} aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs uppercase tracking-[0.25em] text-foreground/55">
                    Text · English only
                  </span>
                  <span className="block font-medium">(832) 381-6078</span>
                </span>
              </a>

              <p className="mt-2 text-sm text-foreground/65 leading-relaxed">
                Phone is not always answered, so email or text is the fastest
                way to reach us.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
