import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTimeRange } from "@/lib/format";
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
  const todayIso = new Date().toISOString().slice(0, 10);

  // New-mode: surface upcoming class_sessions staff have flagged
  // newcomer_friendly so first-timers pick a specific welcoming
  // date — not a recurring class abstraction.
  // Returning-mode: still pick a recurring (non-beginner) class —
  // returning players know the rhythm and don't need date-picking.
  let sessions: SessionOption[] = [];
  if (mode === "new") {
    const { data } = await supabase
      .from("class_sessions")
      .select(
        "id,session_date,start_time,end_time,classes!inner(name,location)",
      )
      .eq("newcomer_friendly", true)
      .gte("session_date", todayIso)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(20);

    sessions = ((data ?? []) as unknown as Array<{
      id: string;
      session_date: string;
      start_time: string;
      end_time: string;
      classes: { name: string; location: string } | null;
    }>).map((s) => ({
      value: s.id,
      label: `${formatDate(s.session_date)} · ${formatTimeRange(s.start_time, s.end_time)}`,
      sub: s.classes?.location ?? undefined,
    }));
  }
  // Returning mode no longer asks about classes — it submits a
  // reactivation request that staff approve. The sessions list stays
  // empty for that branch.

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
              ? "Tell us about you, pick an upcoming session, sign the waiver. We'll email you within a few days with the shirt-payment instructions and what to bring."
              : "Practiced with us before? Type the email you used to register and we'll forward your reactivation request to the founder. You'll hear back by email."
          }
          glyph={mode === "new" ? "始" : "再"}
        />

        <section className="mx-auto max-w-2xl px-6 py-12 md:py-16">
          <ModeSwitcher mode={mode} />

          {mode === "returning" ? (
            <ReturningRegistrationForm />
          ) : sessions.length === 0 ? (
            <EmptyState mode={mode} />
          ) : (
            <RegistrationForm sessions={sessions} />
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
  // Returning mode has its own inline UX (no sessions list to be empty).
  if (mode === "returning") return null;
  return (
    <div className="rounded-md border border-foreground/15 bg-secondary p-6 text-foreground/80">
      <p className="font-medium">
        No newcomer-welcoming sessions are open right now.
      </p>
      <p className="mt-2 text-sm text-foreground/65">
        Our instructors flag specific dates as welcoming for first-timers, and
        nothing&rsquo;s on the calendar at the moment. Email{" "}
        <a
          href="mailto:info@woodlandstaichi.com"
          className="underline underline-offset-2"
        >
          info@woodlandstaichi.com
        </a>{" "}
        and we&rsquo;ll let you know the moment one opens.
      </p>
    </div>
  );
}
