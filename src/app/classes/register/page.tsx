import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { dayLabel, formatTimeRange } from "@/lib/format";
import { RegistrationForm, type SessionOption } from "./registration-form";
import { ReturningRegistrationForm } from "./returning-form";

type Mode = "new" | "returning";

type SearchParams = Promise<{
  mode?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  if (params.mode === "returning") {
    return {
      title: "Re-register — returning player",
      description:
        "Already a Woodlands Tai Chi player? Re-register for the season — no need to start a new beginner registration.",
    };
  }
  return {
    title: "Register for a beginner cohort",
    description:
      "Register for the next Woodlands Tai Chi beginner cohort. Free of charge — only the WTC shirt fee is required.",
  };
}

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const mode: Mode = params.mode === "returning" ? "returning" : "new";

  const supabase = await createClient();
  const baseQuery = supabase
    .from("classes")
    .select("id,name,location,day_of_week,start_time,end_time,level")
    .eq("active", true)
    .order("level", { ascending: true })
    .order("display_order", { ascending: true });

  const query =
    mode === "new"
      ? baseQuery.eq("level", "beginners")
      : baseQuery.neq("level", "beginners");

  const { data } = await query;

  const sessions: SessionOption[] = (data ?? []).map((c) => {
    const time = formatTimeRange(c.start_time, c.end_time);
    const day = dayLabel(c.day_of_week);
    return {
      value: c.id,
      label:
        mode === "new"
          ? `${day} · ${time} · ${c.location}`
          : `${c.name} — ${day} ${time} · ${c.location}`,
    };
  });

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow={
            mode === "new" ? "Beginner registration" : "Returning player"
          }
          title={mode === "new" ? "Begin" : "Welcome"}
          italic={mode === "new" ? "here." : "back."}
          intro={
            mode === "new"
              ? "Tell us about you, pick a cohort, sign the waiver. We'll email you within a few days with the shirt-payment instructions and the first class details."
              : "Already practiced with us? Confirm your details, pick the class you'd like to attend, and re-sign the waiver. The form is short — we still have your record."
          }
          glyph={mode === "new" ? "始" : "再"}
        />

        <section className="mx-auto max-w-2xl px-6 py-12 md:py-16">
          <ModeSwitcher mode={mode} />

          {sessions.length === 0 ? (
            <EmptyState mode={mode} />
          ) : mode === "new" ? (
            <RegistrationForm sessions={sessions} />
          ) : (
            <ReturningRegistrationForm sessions={sessions} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ModeSwitcher({ mode }: { mode: Mode }) {
  return (
    <div className="mb-10 flex items-center gap-1 rounded-full border border-foreground/10 bg-secondary/40 p-1 text-sm">
      <a
        href="/classes/register"
        aria-current={mode === "new" ? "page" : undefined}
        className={`flex-1 rounded-full px-4 py-2 text-center transition-colors ${
          mode === "new"
            ? "bg-foreground text-background font-medium"
            : "text-foreground/65 hover:text-foreground"
        }`}
      >
        New beginner
      </a>
      <a
        href="/classes/register?mode=returning"
        aria-current={mode === "returning" ? "page" : undefined}
        className={`flex-1 rounded-full px-4 py-2 text-center transition-colors ${
          mode === "returning"
            ? "bg-foreground text-background font-medium"
            : "text-foreground/65 hover:text-foreground"
        }`}
      >
        Returning player
      </a>
    </div>
  );
}

function EmptyState({ mode }: { mode: Mode }) {
  if (mode === "returning") {
    return (
      <div className="rounded-md border border-foreground/15 bg-secondary p-6 text-foreground/80">
        <p className="font-medium">No classes are currently open.</p>
        <p className="mt-2 text-sm text-foreground/65">
          Email{" "}
          <a
            href="mailto:info@woodlandstaichi.com"
            className="underline underline-offset-2"
          >
            info@woodlandstaichi.com
          </a>{" "}
          and we&apos;ll let you know when the next session opens.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-foreground/15 bg-secondary p-6 text-foreground/80">
      <p className="font-medium">No beginner sessions are open right now.</p>
      <p className="mt-2 text-sm text-foreground/65">
        Cohorts open three times a year. Email{" "}
        <a
          href="mailto:info@woodlandstaichi.com"
          className="underline underline-offset-2"
        >
          info@woodlandstaichi.com
        </a>{" "}
        to be added to the next-cohort list.
      </p>
    </div>
  );
}
