import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { TestimonialsSection } from "@/components/testimonials-section";

export const metadata: Metadata = {
  title: "About — Meditation in motion",
  description:
    "A non-profit Tai Chi community in The Woodlands, Texas, founded in 2009. Taught in the lineage of Master George Ling Hu under Sifu Sesco Saegusa.",
};

const PILLARS = [
  {
    glyph: "心",
    label: "Mind",
    body: [
      "Have faith, patience, and persistence during taijiquan and be in a good mood while you practice. Relax. Imagine you are weightless, just like a feather floating in the air. Imagine you are swimming in the air — the air is a fluid too.",
      "Avoid any nervous or muscular tension. Empty your mind. Let no distracting thought occupy your mind. Concentrate. Focus your attention on what you are doing. Guide your body movements with a calm and peaceful mind.",
    ],
  },
  {
    glyph: "形",
    label: "Body",
    body: [
      "Suspend your head straight as if someone is pulling your ears up slightly — but no tension must be in your neck. Keep your spine straight and in central equilibrium. This will help you raise your spirit.",
      "Drop your shoulders, sink your elbows naturally, loosen your chest and raise your upper back. Keep the solar plexus area always relaxed, soft and loose. Never protrude your buttocks. Loosen your shoulder, waist, and hip joints when you practice.",
      "Keep your knees soft. Keep your feet firmly on the floor — a balance must be kept at all times. There must be no tension at all on any of the toes. Hand and forearm in a natural, slightly curved shape, fingers extended without touching.",
    ],
  },
  {
    glyph: "氣",
    label: "Breath",
    body: [
      "Keep your tongue on the roof of your mouth. Inhale through your nose and exhale through your mouth — a long, continuous breath without a pause between the inhale and the exhale.",
      "Breathe to and from the belly. Relax.",
    ],
  },
];

const PARTNERS = [
  {
    name: "The Woodlands Methodist Church",
    program: "Adventures in Wellness",
  },
  {
    name: "Lone Star College System",
    program: "Academy for Lifelong Learning",
  },
  {
    name: "Interfaith of the Woodlands",
    program: "Senior Activities Program",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="About us"
          title="A community"
          italic="of practitioners."
          intro="Woodlands Tai Chi is a completely voluntary community of seniors and residents of Montgomery and Harris Counties — open to anyone interested in the exercise of mental and physical health. Founded in 2009. Free for beginners. Always."
          glyph="和"
        />

        {/* Origin / mission */}
        <section
          aria-labelledby="origin-title"
          className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20"
        >
          <div className="grid grid-cols-12 gap-x-6 gap-y-8">
            <div className="col-span-12 md:col-span-5">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Our mission
              </p>
              <h2
                id="origin-title"
                className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
              >
                To exercise
                <span className="block italic text-vermillion">
                  mind, body &amp; spirit.
                </span>
              </h2>
              <p className="mt-6 text-lg text-foreground/75 leading-relaxed max-w-md">
                <span className="font-display italic">
                  At no cost — to our community.
                </span>
              </p>
            </div>

            <div className="col-span-12 md:col-span-7 md:pl-8 space-y-6 text-lg text-foreground/85 leading-relaxed">
              <p>
                Woodlands Tai Chi has been a non-profit cooperative since 2009,
                sponsored entirely by its members. Our average active roster is{" "}
                <strong>73 players</strong> across the past four years (2021–2024).
              </p>
              <p>
                We offer seniors and residents a productive and safe activity
                to help improve their bodies and minds — at no cost. The
                practice is led by <strong>Sifu Sesco Saegusa</strong> with a
                team of dedicated volunteer instructors who give their time,
                care, and presence to every session.
              </p>
              <div className="pt-6 border-t border-foreground/10">
                <p className="text-sm uppercase tracking-[0.25em] text-foreground/55 mb-4">
                  In partnership with
                </p>
                <ul className="space-y-3">
                  {PARTNERS.map((p) => (
                    <li key={p.name} className="flex items-baseline gap-3">
                      <span aria-hidden className="text-vermillion text-xs">
                        ◆
                      </span>
                      <span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-foreground/60"> — {p.program}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Lineage */}
        <section
          aria-labelledby="lineage-title"
          className="relative bg-foreground text-background py-14 md:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="grid grid-cols-12 gap-x-6 gap-y-6">
              <div className="col-span-12 md:col-span-5">
                <p className="text-xs uppercase tracking-[0.45em] text-background/55 mb-6">
                  <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                  Lineage
                </p>
                <h2
                  id="lineage-title"
                  className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
                >
                  Master
                  <span className="block italic text-vermillion-300">
                    George Ling Hu.
                  </span>
                </h2>
              </div>
              <div className="col-span-12 md:col-span-7 md:pl-8">
                <p className="text-xl text-background/90 leading-relaxed font-display italic">
                  &ldquo;Tai chi is often described as &lsquo;meditation in
                  motion,&rsquo; but it might well be called &lsquo;medication
                  in motion.&rsquo; This mind-body practice, which originated
                  in China as a martial art, has value in treating or
                  preventing many health problems. And you can get started
                  even if you aren&apos;t in top shape or the best of
                  health.&rdquo;
                </p>
                <p className="mt-8 text-base text-background/70">
                  The teachings on this site are drawn from the writings and
                  instruction of <strong>Master George Ling Hu</strong>, whose
                  approach to taijiquan grounds our daily practice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three pillars — expanded */}
        <section
          aria-labelledby="pillars-title"
          className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20"
        >
          <div className="mb-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
              <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
              The practice
            </p>
            <h2
              id="pillars-title"
              className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
            >
              Three threads,
              <span className="block italic text-vermillion">one motion.</span>
            </h2>
          </div>

          <div className="space-y-10">
            {PILLARS.map((p, i) => (
              <article
                key={p.label}
                className="grid grid-cols-12 gap-x-6 gap-y-6 border-t border-foreground/10 pt-8"
              >
                <div className="col-span-12 md:col-span-3">
                  <span
                    aria-hidden
                    className="font-display text-8xl md:text-9xl leading-none text-foreground/85 select-none block"
                    style={{
                      textShadow:
                        i === 0
                          ? "0 0 80px color-mix(in oklch, var(--vermillion-500) 50%, transparent)"
                          : undefined,
                    }}
                  >
                    {p.glyph}
                  </span>
                  <p className="mt-4 text-xs uppercase tracking-[0.3em] text-foreground/55">
                    {p.label}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-9 md:pl-8 space-y-5 text-lg text-foreground/85 leading-relaxed">
                  {p.body.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm text-foreground/55 italic max-w-2xl">
            — Based on the teaching and writings of Master George Ling Hu.
          </p>
        </section>

        <TestimonialsSection />

        {/* Closing CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10 md:pb-20">
          <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-card to-secondary p-8 md:p-10 text-center">
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight max-w-2xl mx-auto">
              Show up.
              <span className="italic text-vermillion"> Breathe. </span>
              Begin.
            </h2>
            <p className="mt-6 text-lg text-foreground/75 max-w-xl mx-auto">
              No prior fitness required. No prerequisites. The next beginner
              cohorts open in <strong>June 2026</strong> and{" "}
              <strong>October 2026</strong>.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/classes/register"
                className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
              >
                Register for a beginner cohort →
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
              >
                See the schedule
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
