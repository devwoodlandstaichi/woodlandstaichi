import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { dayLabel, formatTimeRange } from "@/lib/format";
import { RegistrationForm, type SessionOption } from "./registration-form";

export const metadata: Metadata = {
  title: "Register for a beginner cohort",
  description:
    "Register for the next Woodlands Tai Chi beginner cohort. Free of charge — only the WTC shirt fee is required.",
};

// Beginner classes change as admins add/remove them, so render at
// request time and read the live list.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id,name,location,day_of_week,start_time,end_time")
    .eq("level", "beginners")
    .eq("active", true)
    .order("display_order", { ascending: true });

  const sessions: SessionOption[] = (data ?? []).map((c) => ({
    value: c.id,
    label: `${dayLabel(c.day_of_week)} · ${formatTimeRange(c.start_time, c.end_time)} · ${c.location}`,
  }));

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Beginner registration"
          title="Begin"
          italic="here."
          intro="Tell us about you, pick a cohort, sign the waiver. We'll email you within a few days with the shirt-payment instructions and the first class details."
          glyph="始"
        />

        <section className="mx-auto max-w-2xl px-6 py-12 md:py-16">
          {sessions.length === 0 ? (
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
          ) : (
            <RegistrationForm sessions={sessions} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
