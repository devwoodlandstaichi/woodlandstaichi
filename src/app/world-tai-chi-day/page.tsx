import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { WTCD_EVENTS } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "World Tai Chi Day — annual gathering",
  description:
    "Woodlands Tai Chi celebrates World Tai Chi Day every April. Join us April 25, 2026 at North Shore Park.",
};

export default function WorldTaiChiDayPage() {
  const upcoming = WTCD_EVENTS.find((e) => "upcoming" in e && e.upcoming);
  const past = WTCD_EVENTS.filter((e) => !("upcoming" in e && e.upcoming));

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="An annual gathering"
          title="World Tai Chi"
          italic="Day."
          intro="On the last Saturday of April, practitioners across 80 countries gather outdoors to move together at the same hour. Woodlands Tai Chi has hosted a local gathering every year since 2018."
          glyph="慶"
        />

        {/* Upcoming event */}
        {upcoming && (
          <section
            aria-labelledby="upcoming-title"
            className="relative bg-foreground text-background py-24 md:py-32"
          >
            <div className="mx-auto max-w-7xl px-6 md:px-10">
              <div className="grid grid-cols-12 gap-x-6 gap-y-10">
                <div className="col-span-12 lg:col-span-6">
                  <p className="text-xs uppercase tracking-[0.45em] text-background/55 mb-6">
                    <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                    The next one
                  </p>
                  <h2
                    id="upcoming-title"
                    className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight"
                  >
                    {upcoming.year}
                    <span className="block italic text-vermillion-300">
                      {upcoming.date.split(", ")[0]}.
                    </span>
                  </h2>
                  <dl className="mt-10 space-y-4 text-lg text-background/85">
                    <div className="flex flex-wrap gap-3">
                      <dt className="text-xs uppercase tracking-[0.3em] text-background/55 min-w-24 pt-1">
                        Date
                      </dt>
                      <dd>{upcoming.date}</dd>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <dt className="text-xs uppercase tracking-[0.3em] text-background/55 min-w-24 pt-1">
                        Where
                      </dt>
                      <dd>{upcoming.location}</dd>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <dt className="text-xs uppercase tracking-[0.3em] text-background/55 min-w-24 pt-1">
                        Open to
                      </dt>
                      <dd>Members, families, the public — all welcome.</dd>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <dt className="text-xs uppercase tracking-[0.3em] text-background/55 min-w-24 pt-1">
                        Bring
                      </dt>
                      <dd>Water, soft-soled shoes, sunscreen.</dd>
                    </div>
                  </dl>
                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <Link
                      href="/#contact"
                      className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
                    >
                      Tell us you&apos;re coming →
                    </Link>
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-6 flex items-center justify-center lg:justify-end">
                  <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden border border-background/15 bg-background/5">
                    <Image
                      src={upcoming.poster}
                      alt={`${upcoming.year} World Tai Chi Day poster`}
                      fill
                      sizes="(max-width: 1024px) 90vw, 24rem"
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Past events archive */}
        <section
          aria-labelledby="archive-title"
          className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
        >
          <div className="grid grid-cols-12 gap-x-6 gap-y-10 mb-16">
            <div className="col-span-12 md:col-span-5">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Years past
              </p>
              <h2
                id="archive-title"
                className="font-display text-5xl md:text-6xl leading-[1] tracking-tight"
              >
                Posters
                <span className="block italic text-vermillion">
                  &amp; memories.
                </span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-7 md:pt-4">
              <p className="text-lg text-foreground/75 leading-relaxed">
                A small archive of our annual gatherings. Each poster was made
                by a member of the community.
              </p>
            </div>
          </div>

          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <li
                key={event.year}
                className="group rounded-xl border border-foreground/10 bg-card overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[3/4] bg-secondary">
                  <Image
                    src={event.poster}
                    alt={`World Tai Chi Day ${event.year} poster`}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5 flex items-baseline justify-between">
                  <p className="font-display text-2xl tracking-tight">
                    {event.year}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/55">
                    {event.date.split(", ")[0]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
