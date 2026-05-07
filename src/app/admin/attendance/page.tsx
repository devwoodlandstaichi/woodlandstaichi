import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import {
  dayLabel,
  formatDate,
  formatTimeRange,
  isoInSchoolTz,
  levelLabel,
} from "@/lib/format";

export const metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  classes: {
    name: string;
    level: string;
    location: string;
    day_of_week: string;
  } | null;
  attendance: { count: number }[] | null;
};

export default async function AttendanceLanding() {
  const supabase = await createClient();
  const now = new Date();
  const todayIso = isoInSchoolTz(now);

  // Sessions in the next ~14 days, plus today.
  const fourteen = new Date(now.getTime() + 14 * 86400_000)
    .toISOString()
    .slice(0, 10);

  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id,session_date,start_time,end_time,classes(name,level,location,day_of_week),attendance(count)",
    )
    .gte("session_date", todayIso)
    .lte("session_date", fourteen)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  const sessions = (data ?? []) as unknown as SessionRow[];
  const today = sessions.filter((s) => s.session_date === todayIso);
  const upcoming = sessions.filter((s) => s.session_date !== todayIso);

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Pick a session to start scanning."
        helpTopic="attendance"
      />

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        <SessionList
          title="Today"
          rows={today}
          emptyHint="No sessions today."
        />

        <div className="mt-8">
          <SessionList
            title="Upcoming (next 14 days)"
            rows={upcoming}
            emptyHint="No upcoming sessions in the next two weeks. Generate a term in /admin/sessions."
          />
        </div>
      </div>
    </>
  );
}

function SessionList({
  title,
  rows,
  emptyHint,
}: {
  title: string;
  rows: SessionRow[];
  emptyHint: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-foreground/10 px-5 py-4">
        <h2 className="font-display text-lg font-medium tracking-tight">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({rows.length})
          </span>
        </h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul>
          {rows.map((s) => {
            const count = s.attendance?.[0]?.count ?? 0;
            return (
              <li
                key={s.id}
                className="border-b border-foreground/5 last:border-0"
              >
                <Link
                  href={`/admin/attendance/scan/${s.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {s.classes?.name ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(s.session_date)}
                      {s.classes?.day_of_week
                        ? ` · ${dayLabel(s.classes.day_of_week)}`
                        : ""}
                      {" · "}
                      {formatTimeRange(s.start_time, s.end_time)}
                      {s.classes?.location ? ` · ${s.classes.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {s.classes?.level && (
                      <Badge tone="cobalt">{levelLabel(s.classes.level)}</Badge>
                    )}
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {count} scanned
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="text-muted-foreground"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
