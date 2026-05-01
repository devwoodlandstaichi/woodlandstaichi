import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { ContactSection } from "@/components/contact-section";

export const metadata: Metadata = {
  title: "Beginners — Woodlands Tai Chi",
  description:
    "What new students should know before joining a Woodlands Tai Chi beginners class: the curriculum, attendance commitment, dress code, and dojo courtesies.",
};

export const dynamic = "force-static";

type Tile = {
  title: string;
  body: React.ReactNode;
};

const COMMITMENT_TILES: Tile[] = [
  {
    title: "Free of charge",
    body: (
      <>
        <p>
          Classes are <strong>free of charge</strong>. We require participants
          to purchase a WTC shirt as part of registration. You&apos;ll be
          required to wear your shirt to class and events.
        </p>
        <p className="mt-2">
          Upon completion of the Beginners class —{" "}
          <strong>lifetime membership</strong>. If you&apos;re unable to pay,
          let us know and we can make arrangements.
        </p>
      </>
    ),
  },
  {
    title: "Yang 8-step form, four months",
    body: (
      <>
        <p>
          You&apos;ll learn the <strong>Yang 8-step form</strong> — smooth and
          fluid movements that establish the foundation postures for every
          other form taught at WTC.
        </p>
        <p className="mt-2">
          The curriculum runs <strong>four months</strong>. Once completed, you
          advance to the intermediate class.
        </p>
      </>
    ),
  },
  {
    title: "Attend the first four sessions",
    body: (
      <>
        <p>
          You must attend <strong>the first four consecutive sessions</strong>.
          Check your calendar before registering.
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          Classes are limited in size. A no-show takes someone else&apos;s
          spot and will disqualify you from participation for one year, and
          forfeit your registration fee and shirt.
        </p>
      </>
    ),
  },
  {
    title: "Stand for an hour",
    body: (
      <>
        <p>
          You must be ambulatory and able to stand for a{" "}
          <strong>minimum of one hour</strong>. Classes run approximately one
          hour with several water breaks.
        </p>
        <p className="mt-2 text-sm text-foreground/70">
          A remedial class meets Friday at 8:00 AM — ask instructors for
          details after your fourth class. Don&apos;t come to class if you
          can&apos;t stay for the complete session.
        </p>
      </>
    ),
  },
];

type Courtesy = {
  rule: string;
  detail?: string;
};

const COURTESIES: Courtesy[] = [
  {
    rule: "Be on time.",
    detail:
      "Sessions start promptly at their designated meeting times. If you are late, do not enter the dojo while class is in session.",
  },
  {
    rule: "Wear loose, comfortable clothing.",
    detail:
      "WTC shirts (and pants after the fifth week) for practices and special activities. Change in the bathroom or locker room — not in the dojo.",
  },
  {
    rule: "WTC shirts and pants are uniform.",
    detail:
      "You must wear them to practice and other activities. You will not be permitted to participate without your uniform.",
  },
  {
    rule: "Soft, flat-sole shoes.",
    detail:
      "Recommended by experts. No sneakers — they grip the floor. No bare feet (socks are permitted).",
  },
  {
    rule: "No lotions or perfumes.",
    detail:
      "It is very important that we are not impeded in deep breathing. Smokers, please don't come smelling of cigarette smoke — you will be asked to leave or change clothes before the session.",
  },
  {
    rule: "Set mobile devices to silent or off.",
  },
  {
    rule: "Bring bottled drinking water.",
    detail:
      "You will not be permitted out of the dojo. It is now mandatory to bring portable drinking water.",
  },
  {
    rule: "Stop all conversation when entering the dojo.",
  },
  {
    rule: "Maintain classroom protocol.",
    detail:
      "Bow when entering and exiting the dojo. Notify WTC by text or email of absence. Don't disturb the class when departing — leave only during breaks. If a class is in session, wait until the next water break to enter the dojo.",
  },
  {
    rule: "Help with setup and teardown.",
    detail:
      "Please assist helpers in moving banners and computers to the storeroom. At the KBCC classroom, tables and chairs must be put back.",
  },
];

export default function BeginnersPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Beginners"
          title="Before"
          italic="you begin."
          intro="Please read and agree to the following in its entirety. New classes open three times a year — and the first four classes set the foundation for everything that follows."
          glyph="始"
        />

        <section className="mx-auto max-w-5xl px-6 py-3 md:py-5">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            What you&apos;re committing to
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {COMMITMENT_TILES.map((t) => (
              <article
                key={t.title}
                className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-7"
              >
                <h2 className="font-display text-2xl tracking-tight leading-tight">
                  {t.title}
                </h2>
                <div className="mt-3 text-base text-foreground/80 leading-relaxed">
                  {t.body}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-4">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Courtesies
              </p>
              <h2 className="font-display text-3xl md:text-4xl leading-[1.05] tracking-tight">
                Help us create a
                <span className="block italic text-vermillion">
                  peaceful practice environment.
                </span>
              </h2>
              <p className="mt-5 text-base text-foreground/70 leading-relaxed">
                The dojo is shared. These small acts — bowing, silence, soft
                shoes — keep the room available to the next person, and the
                next, and the next.
              </p>
            </div>

            <ol className="md:col-span-8 space-y-4">
              {COURTESIES.map((c, i) => (
                <li
                  key={c.rule}
                  className="flex gap-4 rounded-xl border border-foreground/10 bg-card p-5"
                >
                  <span className="font-mono text-xs tabular-nums text-vermillion pt-1 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-foreground/90">{c.rule}</p>
                    {c.detail && (
                      <p className="mt-1.5 text-sm text-foreground/70 leading-relaxed">
                        {c.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-10 text-center font-display italic text-xl md:text-2xl text-foreground/85">
            Most importantly — leave the outside world at the door.
          </p>
        </section>

        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
