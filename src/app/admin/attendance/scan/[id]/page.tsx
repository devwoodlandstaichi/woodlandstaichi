import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import {
  formatDate,
  formatTimeInSchoolTz,
  formatTimeRange,
  levelLabel,
  todayIsoInSchoolTz,
} from "@/lib/format";
import { Scanner } from "./scanner";
import { KioskLaunchers } from "./kiosk-launchers";
import { DeleteAttendanceButton } from "./delete-attendance-button";

export const metadata = { title: "Scan attendance" };
export const dynamic = "force-dynamic";

type SessionDetail = {
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

type AttendanceRow = {
  id: string;
  scanned_at: string;
  method: "qr" | "manual";
  members: { id: string; first_name: string; last_name: string; level: string } | null;
};

export default async function ScanSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Pull the active member roster too so the scanner client can mirror
  // it into IndexedDB. That mirror lets the scanner resolve a token →
  // name and the manual search box keep working when the venue Wi-Fi
  // drops mid-class.
  const [sessionRes, attRes, rosterRes] = await Promise.all([
    supabase
      .from("class_sessions")
      .select(
        "id,session_date,start_time,end_time,classes(name,level,location)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("attendance")
      .select(
        "id,scanned_at,method,members(id,first_name,last_name,level)",
      )
      .eq("class_session_id", id)
      .order("scanned_at", { ascending: false }),
    supabase
      .from("members")
      .select("id,first_name,last_name,nickname,qr_token,level")
      .neq("status", "inactive"),
  ]);

  const session = sessionRes.data as unknown as SessionDetail | null;
  if (!session) notFound();
  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];
  const roster = (rosterRes.data ?? []).map((m) => ({
    id: m.id as string,
    first_name: m.first_name as string,
    last_name: m.last_name as string,
    nickname: (m.nickname as string | null) ?? null,
    qr_token: (m.qr_token as string | null) ?? null,
    level: (m.level as string | null) ?? null,
  }));

  // Past sessions become read-only history: a live camera scanner is
  // useless once the class has ended. The roster card stays so admins
  // can audit who actually attended.
  const isPast = session.session_date < todayIsoInSchoolTz();

  return (
    <>
      <PageHeader
        title={isPast ? "Attendance — past session" : "Scan attendance"}
        description={`${session.classes?.name ?? "—"} · ${formatDate(session.session_date)} · ${formatTimeRange(session.start_time, session.end_time)}`}
        back="/admin/attendance"
        action={isPast ? null : <KioskLaunchers sessionId={session.id} />}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
      <div
        className={
          isPast
            ? ""
            : // Even split between scanner (camera + manual search) and
              // the live Scanned list. The previous fixed 420px right
              // column left a lot of empty space on wide monitors;
              // 1fr/1fr lets both panels breathe and the scanned list
              // shows ~10 rows above the fold instead of ~5.
              "grid gap-6 lg:grid-cols-2"
        }
      >
        {isPast ? (
          <div className="mb-6 rounded-md border border-foreground/10 bg-secondary/40 px-5 py-4 text-sm text-foreground/75">
            <p className="font-medium text-foreground">
              This session has ended.
            </p>
            <p className="mt-1 text-foreground/65">
              The roster below is read-only. Live scanning is disabled
              for past sessions; if a member was missed, edit their
              attendance via{" "}
              <span className="font-mono text-xs">/admin/members/[id]</span>{" "}
              or contact a developer to backfill.
            </p>
          </div>
        ) : (
          <Scanner sessionId={session.id} roster={roster} />
        )}

        <Card className="overflow-hidden">
          <div className="border-b border-foreground/10 px-5 py-4 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-medium tracking-tight">
              Scanned
            </h2>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {attendance.length}
            </span>
          </div>
          {attendance.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No one scanned in yet for this session.
            </p>
          ) : (
            <ul className="divide-y divide-foreground/5 max-h-[24rem] overflow-y-auto">
              {attendance.map((a) => {
                const memberLabel = a.members
                  ? `${a.members.last_name}, ${a.members.first_name}`
                  : "—";
                return (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{memberLabel}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatTimeInSchoolTz(a.scanned_at)}
                        {" · "}
                        {a.method === "qr" ? "QR" : "Manual"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.members?.level && (
                        <Badge tone="cobalt">{levelLabel(a.members.level)}</Badge>
                      )}
                      {!isPast && a.members && (
                        <DeleteAttendanceButton
                          attendanceId={a.id}
                          sessionId={session.id}
                          memberLabel={memberLabel}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
      </div>
    </>
  );
}
