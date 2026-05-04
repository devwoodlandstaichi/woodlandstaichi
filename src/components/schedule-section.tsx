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

type EventSession = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  classes: {
    name: string;
    level: string;
    location: string;
  } | null;
};

type EventRow = {
  id: string;
  name: string;
  level: string;
  location: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_event: true;
  session_date: string;
  date_label: string;
};

type ScheduleRow = (ClassRow & { is_event?: false }) | EventRow;

const ISO_DAY: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function eventDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// The schedule renders inside an inverted (ink-bg) section, so the
// badge text must be readable on near-black. Use the -300 shades
// (defined in globals.css) and lift the bg/border opacities slightly.
const LEVEL_TONE: Record<string, string> = {
  beginners: "bg-vermillion/15 text-vermillion-300 border-vermillion/35",
  intermediate: "bg-cobalt/15 text-cobalt-300 border-cobalt/35",
  advanced: "bg-cobalt/20 text-cobalt-300 border-cobalt/40",
  remedial: "bg-background/10 text-background/80 border-background/25",
  play_only: "bg-background/10 text-background/80 border-background/25",
  combined: "bg-jade/15 text-jade-300 border-jade/35",
};

export async function ScheduleSection() {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [classesRes, eventsRes] = await Promise.all([
    supabase
      .from("classes")
      .select(
        "id,name,level,location,day_of_week,start_time,end_time,description",
      )
      .eq("active", true)
      // One-off events live as is_one_off classes; the recurring grid
      // shows them via the upcoming-events query below instead.
      .eq("is_one_off", false)
      .order("display_order", { ascending: true }),
    supabase
      .from("class_sessions")
      .select(
        "id,session_date,start_time,end_time,classes!inner(name,level,location,is_one_off)",
      )
      .eq("classes.is_one_off", true)
      .gte("session_date", todayIso)
      .order("session_date", { ascending: true })
      .limit(12),
  ]);

  const error = classesRes.error;
  const recurring: ClassRow[] = classesRes.data ?? [];
  const events = ((eventsRes.data ?? []) as unknown as EventSession[])
    .map<EventRow | null>((s) => {
      const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
      if (!cls) return null;
      const day = ISO_DAY[new Date(`${s.session_date}T00:00:00Z`).getUTCDay()];
      return {
        id: s.id,
        name: cls.name,
        level: cls.level,
        location: cls.location,
        day_of_week: day,
        start_time: s.start_time,
        end_time: s.end_time,
        is_event: true,
        session_date: s.session_date,
        date_label: eventDateLabel(s.session_date),
      };
    })
    .filter((x): x is EventRow => x !== null);

  // Group by day for the layout. Recurring rows + upcoming events
  // share the same column so the calendar reader's eye still finds
  // their day; events are tagged so the renderer styles them with
  // a vermillion "Event" badge and the specific date.
  const byDay = [...recurring, ...events].reduce<
    Record<string, ScheduleRow[]>
  >((acc, r) => {
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
              after a beginners class.
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
                  {byDay[day].length} session
                  {byDay[day].length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="space-y-5">
                {byDay[day]
                  .slice()
                  .sort((a, b) => {
                    // Recurring rows first, events after, both sorted by time.
                    if (!!a.is_event !== !!b.is_event) {
                      return a.is_event ? 1 : -1;
                    }
                    return a.start_time.localeCompare(b.start_time);
                  })
                  .map((c) => (
                    <li key={c.id} className="group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-base font-medium leading-snug">
                            {c.name.replace(
                              /^(Wednesday|Thursday|Friday|Monday|Tuesday|Saturday|Sunday)\s+(Morning|Evening)\s+/i,
                              "",
                            )}
                          </p>
                          <p className="mt-1 text-sm text-background/60">
                            {c.location}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {c.is_event && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-vermillion/40 bg-vermillion/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-vermillion-300">
                              Event · {c.date_label}
                            </span>
                          )}
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                              LEVEL_TONE[c.level] ??
                              "border-background/20 text-background/70"
                            }`}
                          >
                            {levelLabel(c.level)}
                          </span>
                        </div>
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
            Enroll for the next beginners class
            <span aria-hidden>→</span>
          </a>
          <p className="text-sm text-background/60">
            Free for all · Reg/shirt fee at enrollment
          </p>
        </div>
      </div>
    </section>
  );
}
