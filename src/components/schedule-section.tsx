import { createClient } from "@/lib/supabase/server";
import { dayLabel, dayOrder, levelLabel, formatTimeRange } from "@/lib/format";

type ClassRow = {
  id: string;
  name: string;
  level: string;
  location: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  description: string | null;
};

const LEVEL_TONE: Record<string, string> = {
  beginners: "bg-vermillion/10 text-vermillion-600 border-vermillion/20",
  intermediate: "bg-cobalt/10 text-cobalt border-cobalt/20",
  advanced: "bg-cobalt/15 text-cobalt-700 border-cobalt/25",
  remedial: "bg-foreground/5 text-foreground/70 border-foreground/15",
  play_only: "bg-foreground/5 text-foreground/70 border-foreground/15",
  combined: "bg-jade/10 text-jade border-jade/25",
};

export async function ScheduleSection() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id,name,level,location,day_of_week,start_time,end_time,description")
    .eq("active", true)
    .order("display_order", { ascending: true });

  const rows: ClassRow[] = data ?? [];

  // Group by day for the layout
  const byDay = rows.reduce<Record<string, ClassRow[]>>((acc, r) => {
    (acc[r.day_of_week] ||= []).push(r);
    return acc;
  }, {});
  const days = Object.keys(byDay).sort((a, b) => dayOrder(a) - dayOrder(b));

  return (
    <section
      id="classes"
      aria-labelledby="classes-title"
      className="relative bg-foreground text-background py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-12 gap-x-6 gap-y-6 mb-10">
          <div className="col-span-12 md:col-span-7">
            <p className="text-xs uppercase tracking-[0.45em] text-background/55 mb-6">
              <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
              Weekly schedule
            </p>
            <h2
              id="classes-title"
              className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
            >
              When we
              <span className="italic text-vermillion-300"> practice.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:pt-4">
            <p className="text-lg text-background/75 leading-relaxed">
              Beginners are welcome at any of the four open sessions below.
              Intermediate, advanced, and remedial sessions are by invitation
              after a beginner cohort.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-vermillion-300">
            Couldn&apos;t load the schedule. Please refresh.
          </p>
        )}

        {!error && days.length === 0 && (
          <p className="text-background/70 italic">
            No active classes posted right now — please check back soon.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <div
              key={day}
              className="rounded-xl border border-background/10 bg-background/[0.03] p-7"
            >
              <div className="flex items-baseline justify-between border-b border-background/10 pb-4 mb-5">
                <h3 className="font-display text-2xl tracking-tight">
                  {dayLabel(day)}
                </h3>
                <span className="text-xs uppercase tracking-[0.25em] text-background/50">
                  {byDay[day].length} session{byDay[day].length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="space-y-5">
                {byDay[day]
                  .slice()
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((c) => (
                    <li key={c.id} className="group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-base font-medium leading-snug">
                            {c.name.replace(/^(Wednesday|Thursday|Friday|Monday|Tuesday|Saturday|Sunday)\s+(Morning|Evening)\s+/i, "")}
                          </p>
                          <p className="mt-1 text-sm text-background/60">
                            {c.location}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                            LEVEL_TONE[c.level] ??
                            "border-background/20 text-background/70"
                          }`}
                        >
                          {levelLabel(c.level)}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-sm tabular-nums text-background/85">
                        {formatTimeRange(c.start_time, c.end_time)}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#contact"
            className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
          >
            Enroll for the next beginner cohort
            <span aria-hidden>→</span>
          </a>
          <p className="text-sm text-background/60">
            Free for beginners · Reg/shirt fee at enrollment
          </p>
        </div>
      </div>
    </section>
  );
}
