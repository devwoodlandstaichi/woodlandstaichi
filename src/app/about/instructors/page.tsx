import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Volunteer instructors — who teaches",
  description:
    "Sifu Sesco Saegusa and the team of volunteer instructors who teach Tai Chi at Woodlands Tai Chi.",
};

export const dynamic = "force-dynamic";

type Tier = "founder" | "senior" | "instructor" | "assistant";

type Instructor = {
  id: string;
  name: string;
  tier: Tier;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export default async function InstructorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("id,name,tier,title,bio,photo_url")
    .eq("active", true)
    .order("display_order", { ascending: true });
  const all = (data ?? []) as Instructor[];

  const founders = all.filter((i) => i.tier === "founder");
  const seniors = all.filter((i) => i.tier === "senior");
  const instructors = all.filter((i) => i.tier === "instructor");
  const assistants = all.filter((i) => i.tier === "assistant");

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

        <section className="mx-auto max-w-5xl px-6 py-3 md:py-5">
          {/* Founder */}
          {founders.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Founder &amp; group director
              </p>
              {founders.map((f) => (
                <FounderCard key={f.id} instructor={f} />
              ))}
            </div>
          )}

          {/* Senior */}
          {seniors.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Senior instructors
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {seniors.map((i) => (
                  <InstructorCard key={i.id} instructor={i} />
                ))}
              </div>
            </div>
          )}

          {/* Instructor */}
          {instructors.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Instructors
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                {instructors.map((i) => (
                  <InstructorCard key={i.id} instructor={i} compact />
                ))}
              </div>
            </div>
          )}

          {/* Assistant */}
          {assistants.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
                <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
                Assistant instructors
              </p>
              <ul className="flex flex-wrap gap-3">
                {assistants.map((a) => (
                  <li
                    key={a.id}
                    className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-4 py-2 text-sm"
                  >
                    {a.photo_url ? (
                      <Image
                        src={a.photo_url}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 text-xs font-medium"
                      >
                        {initials(a.name)}
                      </span>
                    )}
                    {a.name}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-foreground/55 italic">
                Plus countless hands across every cohort.
              </p>
            </div>
          )}

          {/* Closing CTA */}
          <div className="mt-10 rounded-2xl border border-foreground/10 bg-gradient-to-br from-card to-secondary p-8 md:p-10 text-center">
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

function FounderCard({ instructor }: { instructor: Instructor }) {
  const firstName = instructor.name.split(" ")[0];
  const rest = instructor.name.split(" ").slice(1).join(" ");
  return (
    <article className="grid grid-cols-12 gap-6 md:gap-8 rounded-2xl border border-foreground/10 bg-card p-7 md:p-10">
      <div className="col-span-12 md:col-span-3 flex md:flex-col items-center md:items-start gap-4">
        {instructor.photo_url ? (
          <Image
            src={instructor.photo_url}
            alt={instructor.name}
            width={160}
            height={160}
            className="h-20 w-20 md:h-32 md:w-32 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="inline-flex h-20 w-20 md:h-28 md:w-28 items-center justify-center rounded-full bg-vermillion/10 text-vermillion font-display text-3xl md:text-4xl"
          >
            {initials(instructor.name)}
          </span>
        )}
        <div>
          <h2 className="font-display text-3xl md:text-4xl leading-[1.1] tracking-tight">
            Sifu {firstName}
            {rest && (
              <span className="block italic text-vermillion text-2xl md:text-3xl">
                {rest}
              </span>
            )}
          </h2>
          {instructor.title && (
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-foreground/55">
              {instructor.title}
            </p>
          )}
        </div>
      </div>
      <div className="col-span-12 md:col-span-9">
        {instructor.bio ? (
          <p className="text-lg text-foreground/85 leading-relaxed">
            {instructor.bio}
          </p>
        ) : (
          <p className="text-base text-foreground/55 italic">
            Bio coming soon.
          </p>
        )}
      </div>
    </article>
  );
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
        {instructor.photo_url ? (
          <Image
            src={instructor.photo_url}
            alt={instructor.name}
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-vermillion/10 text-vermillion font-display text-lg"
          >
            {initials(instructor.name)}
          </span>
        )}
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
