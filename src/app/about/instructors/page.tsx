import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Volunteer instructors — who teaches",
  description:
    "Sifu Sesco Saegusa and the team of volunteer instructors who teach Tai Chi at Woodlands Tai Chi.",
};

// Bios transcribed verbatim from /tai-chi-players/ on the legacy site.
// Apostrophes, em-dashes, capitalisation, and any typos preserved on
// purpose — the language is the founder's. Worth a Sifu pass before
// production cutover (flagged in CLAUDE.md).

type Instructor = {
  name: string;
  initials: string;
  bio?: string;
};

const FOUNDER: Instructor = {
  name: "Sesco Saegusa",
  initials: "SS",
  bio: "I started Tai Chi when I retired, my physician informed me of a choice of continuing down the destructive lifestyle or to exercise and live. Due to a back injury , invasive exercise was out. A nurse friend recommended tai chi, which I reluctantly signed up for, after the first session I was hooked, to facilitate playing Tai Chi out of the Texas sun, arrangements were made with the Friendship Center (SCCC), the use of their facility in exchange for teaching seniors citizens Tai Chi. My interest grew as I studied with several Sifu and Masters, I felt that Tai Chi was a life saver, and I wanted others who maybe in a similar situation to benefit from it. I have been instructing since 2009 and have taught many hundreds of students. Many have started their own classes.",
};

const SENIOR: Instructor[] = [
  {
    name: "Jim Edgar",
    initials: "JE",
    bio: "A few years ago I tried to learn Tai Chi from a Great Course video without much success. The reason for my interest was that i wanted a whole body and mind workout that I could practice for the rest of my life. I found Woodlands TaiChi mid 2020 and must say that the group and the and the art itself has exceeded all expectations. I have improved my balance, my focus, my strength, my ability to concentrate and when you find yourself in a meditative state it makes it even more worthwhile. A great tool for accomplishing a comfortable and active lifestyle for the remainder of my journey.",
  },
  {
    name: "Tom Glascock",
    initials: "TG",
    bio: "Learning, and regularly playing, Tai chi has helped improve my balance, flexibility and focus. As important as the physical benefits I have enjoyed are the mental and social aspects. Learning the steps/movements is challenging, but I find that, as I learn those, the physical benefits are more pronounced as I become more relaxed as I play. With help from all of the instructors, I really enjoy the time I am able to spend with the diverse group of individuals that comprise Woodlands Tai Chi.",
  },
];

const INSTRUCTORS: Instructor[] = [
  {
    name: "Linda Skogsberg",
    initials: "LS",
    bio: "Little did I know when I registered for tai chi through the local college that it would become such an important part of my life. I was already getting more than enough exercise from running, racing and weight training, but I wanted to find a complementary activity that was somewhat less strenuous yet still a whole body workout and also self-directed. That turned out to be tai chi, which has the added benefit of supporting a strong mind-body connection. Tai chi is said to be Harmony. As students of this discipline at Woodlands Tai Chi, we seek to achieve balance in all things and, eventually, to find inner peace. Mayo Clinic promotes tai chi as a gentle way to fight stress by letting go; this takes willpower and perseverance. Thus tai chi is character building as well as an excellent way to increase flexibility, muscle tone and endurance. The forms we learn will stay with us for life and, if we are lucky, the friends we make will do the same.",
  },
  {
    name: "Chuck Walsko",
    initials: "CW",
  },
  {
    name: "Sharon Holzscherer",
    initials: "SH",
    bio: "I first learned with tai chi in Ottawa, Canada over a decade ago. Then I had to stop due to changes in my life. After moving to Texas, I was so delighted to find the Woodlands Tai Chi group. Tai chi is often referred to as a moving meditation. The concentration and focus needed are great for my mind. I also enjoy the physical benefits of balance, coordination and movement. Coming from a background of dance, I find tai chi to be a lovely way to move without tension. I also enjoy the social aspect of the great group that I have found here.",
  },
];

const ASSISTANTS: string[] = [
  "Denise Gavino",
  "Jenette Champagne",
  "Chanthy Gutierre",
  "Jerry Jackson",
  "Julie Devine",
  "Sanjiv Dhanjal",
  "Vincent Bui",
  "Kimberly Fuller",
  "Cesar Gracia",
];

export default function InstructorsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Volunteer instructors"
          title="Who"
          italic="teaches."
          intro="Every instructor at Woodlands Tai Chi is a volunteer. They give their time, their care, and their experience because the practice gave it to them first."
          glyph="師"
        />

        {/* === Founder ====================================================== */}
        <section className="mx-auto max-w-5xl px-6 py-10 md:py-14">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Founder &amp; group director
          </p>
          <article className="grid grid-cols-12 gap-6 md:gap-8 rounded-2xl border border-foreground/10 bg-card p-7 md:p-10">
            <div className="col-span-12 md:col-span-3 flex md:flex-col items-center md:items-start gap-4">
              <span
                aria-hidden
                className="inline-flex h-20 w-20 md:h-28 md:w-28 items-center justify-center rounded-full bg-vermillion/10 text-vermillion font-display text-3xl md:text-4xl"
              >
                {FOUNDER.initials}
              </span>
              <div>
                <h2 className="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight">
                  Sifu {FOUNDER.name.split(" ")[0]}{" "}
                  <span className="block italic text-vermillion text-2xl md:text-3xl">
                    {FOUNDER.name.split(" ").slice(1).join(" ")}
                  </span>
                </h2>
                <p className="mt-2 text-xs uppercase tracking-[0.25em] text-foreground/55">
                  Senior Instructor &middot; Teaching since 2009
                </p>
              </div>
            </div>
            <div className="col-span-12 md:col-span-9">
              <p className="text-lg text-foreground/85 leading-relaxed">
                {FOUNDER.bio}
              </p>
            </div>
          </article>
        </section>

        {/* === Senior instructors =========================================== */}
        <section className="mx-auto max-w-5xl px-6 py-6 md:py-10">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Senior instructors
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {SENIOR.map((i) => (
              <InstructorCard key={i.name} instructor={i} />
            ))}
          </div>
        </section>

        {/* === Instructors ================================================= */}
        <section className="mx-auto max-w-5xl px-6 py-6 md:py-10">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Instructors
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {INSTRUCTORS.map((i) => (
              <InstructorCard key={i.name} instructor={i} compact />
            ))}
          </div>
        </section>

        {/* === Assistant instructors ======================================== */}
        <section className="mx-auto max-w-5xl px-6 py-6 md:py-10">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Assistant instructors
          </p>
          <ul className="flex flex-wrap gap-3">
            {ASSISTANTS.map((name) => (
              <li
                key={name}
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-4 py-2 text-sm"
              >
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 text-xs font-medium"
                >
                  {initials(name)}
                </span>
                {name}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-foreground/55 italic">
            Plus countless hands across every cohort.
          </p>
        </section>

        {/* === Closing CTA ================================================= */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl border border-foreground/10 bg-gradient-to-br from-card to-secondary p-8 md:p-10 text-center">
            <h2 className="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight max-w-2xl mx-auto">
              Want to learn from them?
              <span className="block italic text-vermillion mt-1">
                Class is free.
              </span>
            </h2>
            <p className="mt-5 text-base text-foreground/75 max-w-xl mx-auto">
              The next beginner cohorts open in <strong>June 2026</strong> and{" "}
              <strong>October 2026</strong>.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/classes/register"
                className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
              >
                Register for a beginner cohort →
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
              >
                Back to About
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

function InstructorCard({
  instructor,
  compact = false,
}: {
  instructor: Instructor;
  compact?: boolean;
}) {
  return (
    <article className="rounded-xl border border-foreground/10 bg-card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <span
          aria-hidden
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-vermillion/10 text-vermillion font-display text-lg"
        >
          {instructor.initials}
        </span>
        <h3 className="font-display text-xl tracking-tight leading-tight">
          {instructor.name}
        </h3>
      </div>
      {instructor.bio ? (
        <p
          className={
            compact
              ? "text-sm text-foreground/75 leading-relaxed"
              : "text-base text-foreground/80 leading-relaxed"
          }
        >
          {instructor.bio}
        </p>
      ) : (
        <p className="text-sm text-foreground/55 italic">
          Bio coming soon.
        </p>
      )}
    </article>
  );
}
