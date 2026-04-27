import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { ScheduleSection } from "@/components/schedule-section";
import {
  CLASS_LEVELS,
  HOLIDAY_CLOSURES,
  REGISTRATION_STEPS,
  COURTESIES,
  BEGINNER_COHORT_DATES,
} from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Classes — schedule, levels & registration",
  description:
    "Free beginner Tai Chi classes in The Woodlands, Texas. Yang 8-step form, 4-month curriculum, soft soles required, water mandatory. Now enrolling June and October 2026.",
};

const STATUS_TONE: Record<string, string> = {
  past: "border-foreground/15 text-foreground/40",
  filling: "border-vermillion/30 text-vermillion-600 bg-vermillion/5",
  open: "border-jade/30 text-jade bg-jade/5",
};

const STATUS_LABEL: Record<string, string> = {
  past: "Closed",
  filling: "Waitlist",
  open: "Open",
};

export default function ClassesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Classes"
          title="Show up,"
          italic="and we'll meet you."
          intro="Beginner classes are free of charge and open to anyone — no prior fitness or martial-arts background required. The Yang 8-step form is the foundation of every form that follows."
          glyph="課"
        />

        {/* Beginner cohorts */}
        <section
          aria-labelledby="cohorts-title"
          className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20"
        >
          <div className="grid grid-cols-12 gap-x-6 gap-y-6 mb-8">
            <div className="col-span-12 md:col-span-6">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Upcoming cohorts
              </p>
              <h2
                id="cohorts-title"
                className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
              >
                Three start dates
                <span className="block italic text-vermillion">a year.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-6 md:pt-4">
              <p className="text-lg text-foreground/75 leading-relaxed">
                Beginner cohorts open in February, June, and late September.
                Cohorts are capacity-limited; once filled, names roll to a
                waiting list for the next session.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {BEGINNER_COHORT_DATES.map((c) => (
              <article
                key={c.label}
                className="rounded-xl border border-foreground/10 bg-card p-7"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl tracking-tight">
                    {c.label}
                  </h3>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                      STATUS_TONE[c.status] ?? "border-foreground/15"
                    }`}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <ul className="mt-5 space-y-2 text-base text-foreground/80">
                  {c.days.map((d) => (
                    <li key={d} className="flex items-center gap-3">
                      <span aria-hidden className="text-vermillion text-xs">
                        ◆
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Levels */}
        <section
          aria-labelledby="levels-title"
          className="relative bg-foreground text-background py-14 md:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.45em] text-background/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Levels
              </p>
              <h2
                id="levels-title"
                className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
              >
                One curriculum,
                <span className="block italic text-vermillion-300">
                  several stages.
                </span>
              </h2>
            </div>

            <div className="space-y-8">
              {CLASS_LEVELS.map((level) => (
                <article
                  key={level.label}
                  className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-background/15 pt-8"
                >
                  <div className="col-span-12 md:col-span-3">
                    <span
                      aria-hidden
                      className="font-display text-7xl md:text-8xl leading-none text-background/85 select-none block"
                    >
                      {level.glyph}
                    </span>
                    <p className="mt-3 font-display text-2xl tracking-tight">
                      {level.label}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-background/50">
                      {level.duration}
                    </p>
                  </div>
                  <div className="col-span-12 md:col-span-9 md:pl-8 space-y-5 text-lg text-background/85 leading-relaxed">
                    <p>{level.description}</p>
                    <ul className="space-y-2 text-base text-background/75">
                      {level.requirements.map((r) => (
                        <li key={r} className="flex items-start gap-3">
                          <span aria-hidden className="text-vermillion-300 mt-2">
                            —
                          </span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Schedule grid (live from DB) */}
        <ScheduleSection />

        {/* Registration steps */}
        <section
          aria-labelledby="register-title"
          className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20"
        >
          <div className="grid grid-cols-12 gap-x-6 gap-y-6 mb-8">
            <div className="col-span-12 md:col-span-5">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Registration
              </p>
              <h2
                id="register-title"
                className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
              >
                Four steps,
                <span className="block italic text-vermillion">no hurry.</span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-7 md:pt-4">
              <p className="text-lg text-foreground/75 leading-relaxed">
                Class is free. The WTC shirt — required for all members — is
                the only fee, paid at registration via Zelle, Venmo, Apple
                Pay, or PayPal. You aren&apos;t enrolled until payment is
                received.
              </p>
              <p className="mt-3 text-sm text-foreground/55 italic">
                If paying for the shirt is a hardship, tell us — we&apos;ll
                work it out.
              </p>
            </div>
          </div>

          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {REGISTRATION_STEPS.map((step) => (
              <li
                key={step.n}
                className="relative rounded-xl border border-foreground/10 bg-card p-7"
              >
                <span
                  aria-hidden
                  className="absolute right-5 top-5 font-display text-5xl text-vermillion/15 leading-none select-none"
                >
                  {step.n}
                </span>
                <h3 className="font-display text-xl tracking-tight pr-12">
                  {step.title}
                </h3>
                <p className="mt-3 text-base text-foreground/75 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/classes/register"
              className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
            >
              Register for a beginner cohort
              <span aria-hidden>→</span>
            </Link>
            <p className="text-sm text-foreground/55">
              Free to join. Only the shirt fee is required at enrollment.
            </p>
          </div>
        </section>

        {/* Holiday closures */}
        <section
          aria-labelledby="closures-title"
          className="mx-auto max-w-7xl px-6 pb-14 md:px-10 md:pb-20"
        >
          <div className="rounded-2xl border border-foreground/10 bg-secondary p-8 md:p-10">
            <div className="grid grid-cols-12 gap-x-6 gap-y-8">
              <div className="col-span-12 md:col-span-5">
                <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                  <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                  No class on
                </p>
                <h2
                  id="closures-title"
                  className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
                >
                  Holiday
                  <span className="block italic text-vermillion">closures.</span>
                </h2>
              </div>
              <div className="col-span-12 md:col-span-7">
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-base">
                  {HOLIDAY_CLOSURES.map((h) => (
                    <li
                      key={h.name}
                      className="flex items-baseline justify-between gap-3 border-b border-foreground/10 pb-2"
                    >
                      <span className="font-medium">{h.name}</span>
                      <span className="text-sm text-foreground/60">
                        {h.date}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Courtesies */}
        <section
          aria-labelledby="courtesies-title"
          className="mx-auto max-w-7xl px-6 pb-14 md:px-10 md:pb-20"
        >
          <div className="grid grid-cols-12 gap-x-6 gap-y-6">
            <div className="col-span-12 md:col-span-5">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                In the dojo
              </p>
              <h2
                id="courtesies-title"
                className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
              >
                A few
                <span className="block italic text-vermillion">courtesies.</span>
              </h2>
              <p className="mt-6 text-lg text-foreground/75 leading-relaxed max-w-md">
                The form asks for the same care from all of us. These are
                small habits that make the room work.
              </p>
            </div>
            <div className="col-span-12 md:col-span-7 md:pl-8">
              <ul className="space-y-3 text-base text-foreground/85">
                {COURTESIES.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 border-t border-foreground/10 pt-3"
                  >
                    <span
                      aria-hidden
                      className="font-mono text-xs text-foreground/40 tabular-nums pt-1"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10 md:pb-20">
          <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-card to-secondary p-8 md:p-10 text-center">
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight max-w-2xl mx-auto">
              Questions before
              <span className="italic text-vermillion"> you begin?</span>
            </h2>
            <p className="mt-6 text-lg text-foreground/75 max-w-xl mx-auto">
              Email or text us — happy to answer anything before you commit.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/#contact"
                className="inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background hover:-translate-y-0.5 transition-transform"
              >
                Reach out →
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
              >
                About the practice
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
