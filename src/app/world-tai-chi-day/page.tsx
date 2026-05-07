import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { todayIsoInSchoolTz } from "@/lib/format";

export const metadata: Metadata = {
  title: "World Tai Chi Day — annual gathering",
  description:
    "Woodlands Tai Chi celebrates World Tai Chi Day every April. Join us at the next gathering in The Woodlands.",
};

export const dynamic = "force-dynamic";

type WtcdEvent = {
  id: string;
  year: number;
  event_date: string;
  location: string;
  intro: string | null;
  poster_url: string | null;
  gallery_url: string | null;
};

// "April 25, 2026" — built locally so the public page doesn't have to
// keep a parallel `date` string column in sync with `event_date`.
function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default async function WorldTaiChiDayPage() {
  const supabase = await createClient();
  const todayIso = todayIsoInSchoolTz();

  const { data } = await supabase
    .from("wtcd_events")
    .select(
      "id,year,event_date,location,intro,poster_url,gallery_url",
    )
    .eq("active", true)
    .order("event_date", { ascending: false });

  const events = (data ?? []) as WtcdEvent[];

  // Featured = the latest event (the one whose date is closest to "now",
  // looking forward first). When the next year hasn't been added yet
  // and the most recent date is in the past, we still feature it but
  // shift the framing to "Most recent gathering" so the page never goes
  // dark in the gap between the founder finishing one year and posting
  // the next. `events` is already sorted by event_date desc.
  const futureFirst = events.find((e) => e.event_date >= todayIso);
  const featured = futureFirst ?? events[0] ?? null;
  const isUpcoming = !!featured && featured.event_date >= todayIso;
  const past = events.filter((e) => e.id !== featured?.id);

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

        {/* Featured event — upcoming when there's a future date, the
            most recent past one as a fallback so the hero never goes
            dark between years. Framing shifts based on isUpcoming. */}
        {featured && (
          <section
            aria-labelledby="featured-title"
            className="relative bg-foreground text-background py-14 md:py-20"
          >
            <div className="mx-auto max-w-7xl px-6 md:px-10">
              <div className="grid grid-cols-12 gap-x-6 gap-y-6">
                <div className="col-span-12 lg:col-span-6">
                  <p className="text-xs uppercase tracking-[0.45em] text-background/55 mb-6">
                    <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                    {isUpcoming ? "The next one" : "Most recent gathering"}
                  </p>
                  <h2
                    id="featured-title"
                    className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
                  >
                    {featured.year}
                    <span className="block italic text-vermillion-300">
                      {formatMonthDay(featured.event_date)}.
                    </span>
                  </h2>
                  <dl className="mt-6 space-y-4 text-lg text-background/85">
                    <div className="flex flex-wrap gap-3">
                      <dt className="text-xs uppercase tracking-[0.3em] text-background/55 min-w-24 pt-1">
                        Date
                      </dt>
                      <dd>{formatLongDate(featured.event_date)}</dd>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <dt className="text-xs uppercase tracking-[0.3em] text-background/55 min-w-24 pt-1">
                        Where
                      </dt>
                      <dd>{featured.location}</dd>
                    </div>
                    {isUpcoming && (
                      <>
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
                      </>
                    )}
                  </dl>
                  {featured.intro && (
                    <p className="mt-6 max-w-prose text-base text-background/80 leading-relaxed">
                      {featured.intro}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    {isUpcoming ? (
                      <Link
                        href="/#contact"
                        className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
                      >
                        Tell us you&apos;re coming →
                      </Link>
                    ) : (
                      <p className="text-sm text-background/65 italic">
                        Save the date — we gather every April. The next year&rsquo;s
                        flyer goes up here once it&rsquo;s ready.
                      </p>
                    )}
                    {featured.gallery_url && (
                      <a
                        href={featured.gallery_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-background/25 px-5 py-3 text-sm text-background/85 hover:bg-background/10 transition-colors"
                      >
                        View gallery
                        <ExternalLink size={14} aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-6 flex items-center justify-center lg:justify-end">
                  {featured.poster_url && (
                    <PosterFrame
                      url={featured.poster_url}
                      year={featured.year}
                      gallery={featured.gallery_url}
                      priority
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Past events archive */}
        <section
          aria-labelledby="archive-title"
          className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20"
        >
          <div className="grid grid-cols-12 gap-x-6 gap-y-6 mb-10">
            <div className="col-span-12 md:col-span-5">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Years past
              </p>
              <h2
                id="archive-title"
                className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
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
            {past.map((event) => {
              const inner = (
                <>
                  <div className="relative aspect-[3/4] bg-secondary">
                    {event.poster_url ? (
                      <Image
                        src={event.poster_url}
                        alt={`World Tai Chi Day ${event.year} poster`}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-5xl text-foreground/30">
                        {event.year}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex items-baseline justify-between">
                    <p className="font-display text-2xl tracking-tight inline-flex items-baseline gap-1.5">
                      {event.year}
                      {event.gallery_url && (
                        <ExternalLink
                          size={14}
                          aria-hidden
                          className="text-foreground/45"
                        />
                      )}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/55">
                      {formatMonthDay(event.event_date)}
                    </p>
                  </div>
                </>
              );
              return (
                <li
                  key={event.id}
                  className="group rounded-xl border border-foreground/10 bg-card overflow-hidden transition-shadow hover:shadow-lg"
                >
                  {event.gallery_url ? (
                    <a
                      href={event.gallery_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${event.year} gallery`}
                      className="block"
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function PosterFrame({
  url,
  year,
  gallery,
  priority,
}: {
  url: string;
  year: number;
  gallery: string | null;
  priority?: boolean;
}) {
  const inner = (
    <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden border border-background/15 bg-background/5">
      <Image
        src={url}
        alt={`${year} World Tai Chi Day poster`}
        fill
        sizes="(max-width: 1024px) 90vw, 24rem"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
  if (!gallery) return inner;
  return (
    <a
      href={gallery}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${year} gallery`}
      className="block transition-transform hover:scale-[1.01]"
    >
      {inner}
    </a>
  );
}
