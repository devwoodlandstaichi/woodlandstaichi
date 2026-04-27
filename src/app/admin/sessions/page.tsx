import { createClient } from "@/lib/supabase/server";
import {
  Badge,
  Card,
  PageHeader,
} from "@/components/admin/ui";
import {
  formatDate,
  formatTimeRange,
  levelLabel,
} from "@/lib/format";
import { GenerateTermForm } from "./generate-term-form";

export const metadata = { title: "Sessions" };
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
  } | null;
};

export default async function SessionsPage() {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [upcomingRes, recentRes] = await Promise.all([
    supabase
      .from("class_sessions")
      .select(
        "id,session_date,start_time,end_time,classes(name,level,location)",
      )
      .gte("session_date", todayIso)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(50),
    supabase
      .from("class_sessions")
      .select(
        "id,session_date,start_time,end_time,classes(name,level,location)",
      )
      .lt("session_date", todayIso)
      .order("session_date", { ascending: false })
      .order("start_time", { ascending: true })
      .limit(15),
  ]);

  const upcoming = (upcomingRes.data ?? []) as unknown as SessionRow[];
  const recent = (recentRes.data ?? []) as unknown as SessionRow[];

  return (
    <>
      <PageHeader
        title="Sessions"
        description="Specific class occurrences on a date. Phase 3 attendance writes against these rows."
      />

      <div className="grid gap-6">
        <GenerateTermForm />

        <SessionTable
          title="Upcoming"
          rows={upcoming}
          emptyHint="No upcoming sessions yet — generate a term above."
        />

        {recent.length > 0 && (
          <SessionTable
            title="Recent past"
            rows={recent}
            emptyHint=""
            muted
          />
        )}
      </div>
    </>
  );
}

function SessionTable({
  title,
  rows,
  emptyHint,
  muted = false,
}: {
  title: string;
  rows: SessionRow[];
  emptyHint: string;
  muted?: boolean;
}) {
  return (
    <Card className={muted ? "opacity-90" : ""}>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Where</th>
                <th className="px-5 py-3 font-medium">Level</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-foreground/5 last:border-0"
                >
                  <td className="px-5 py-3 font-medium">
                    {formatDate(s.session_date)}
                  </td>
                  <td className="px-5 py-3">{s.classes?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatTimeRange(s.start_time, s.end_time)}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {s.classes?.location ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {s.classes?.level && (
                      <Badge tone="cobalt">{levelLabel(s.classes.level)}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
