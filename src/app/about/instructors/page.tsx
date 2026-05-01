import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { ContactSection } from "@/components/contact-section";

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
  member_id: string | null;
  members: { bio: string | null; photo_url: string | null } | null;
};

const TIER_LABEL: Record<Tier, string> = {
  founder: "Founder · Group Director",
  senior: "Senior Instructor",
  instructor: "Instructor",
  assistant: "Assistant Instructor",
};

const TIER_BANNER: Record<Tier, string> = {
  founder:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--vermillion-500)_45%,transparent),color-mix(in_oklch,var(--vermillion-500)_15%,transparent))]",
  senior:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--cobalt-500)_40%,transparent),color-mix(in_oklch,var(--cobalt-500)_10%,transparent))]",
  instructor:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--jade-500)_35%,transparent),color-mix(in_oklch,var(--jade-500)_8%,transparent))]",
  assistant:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--ink-500)_18%,transparent),color-mix(in_oklch,var(--ink-500)_5%,transparent))]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export default async function InstructorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select(
      "id,name,tier,title,bio,photo_url,member_id,members(bio,photo_url)",
    )
    .eq("active", true)
    .order("display_order", { ascending: true });
  const all = (data ?? []) as unknown as Instructor[];

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
              <div className="grid gap-6 md:grid-cols-1">
                {founders.map((f) => (
                  <InstructorCard key={f.id} instructor={f} featured />
                ))}
              </div>
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
                  <InstructorCard key={i.id} instructor={i} />
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
              <div className="grid gap-6 md:grid-cols-3">
                {assistants.map((a) => (
                  <InstructorCard key={a.id} instructor={a} />
                ))}
              </div>
              <p className="mt-6 text-sm text-foreground/55 italic">
                Plus countless hands across every class.
              </p>
            </div>
          )}

        </section>

        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}

function InstructorCard({
  instructor,
  featured = false,
}: {
  instructor: Instructor;
  featured?: boolean;
}) {
  const subtitle = instructor.title ?? TIER_LABEL[instructor.tier];
  const photo = instructor.photo_url ?? instructor.members?.photo_url ?? null;
  const bio = instructor.bio ?? instructor.members?.bio ?? null;
  const avatar = featured ? "h-28 w-28 md:h-32 md:w-32" : "h-20 w-20";
  const avatarOffset = featured ? "-mt-14 md:-mt-16" : "-mt-10";
  const banner = featured ? "h-32 md:h-40" : "h-14";
  const nameSize = featured
    ? "font-display text-3xl md:text-4xl leading-[1.05] tracking-tight"
    : "font-display text-xl md:text-2xl leading-tight tracking-tight";

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-sm">
      <div className={`relative ${banner} ${TIER_BANNER[instructor.tier]}`} />

      <div className={`px-6 ${avatarOffset}`}>
        {photo ? (
          <Image
            src={photo}
            alt={instructor.name}
            width={featured ? 160 : 96}
            height={featured ? 160 : 96}
            className={`${avatar} rounded-full object-cover border-4 border-card shadow-sm`}
          />
        ) : (
          <span
            aria-hidden
            className={`inline-flex ${avatar} items-center justify-center rounded-full bg-ink-950 text-ink-50 font-display text-3xl border-4 border-card shadow-sm`}
          >
            {initials(instructor.name)}
          </span>
        )}
      </div>

      <div className="px-6 pt-4">
        <h3 className={nameSize}>
          {featured && instructor.tier === "founder" ? (
            <>
              Sifu{" "}
              <span className="italic text-vermillion">{instructor.name}</span>
            </>
          ) : (
            instructor.name
          )}
        </h3>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.22em] text-foreground/55">
          {subtitle}
        </p>
      </div>

      <div className="px-6 pt-5 pb-6 flex-1">
        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/45 mb-2">
          About
        </p>
        {bio ? (
          <p
            className={
              featured
                ? "text-base md:text-lg text-foreground/85 leading-relaxed"
                : "text-sm text-foreground/80 leading-relaxed"
            }
          >
            {bio}
          </p>
        ) : (
          <p className="text-sm text-foreground/55 italic">
            Bio coming soon.
          </p>
        )}
      </div>
    </article>
  );
}
