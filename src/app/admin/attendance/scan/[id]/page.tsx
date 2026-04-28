import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import { formatDate, formatTimeRange, levelLabel } from "@/lib/format";
import { Scanner } from "./scanner";
import { KioskLaunchers } from "./kiosk-launchers";

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

  const [sessionRes, attRes] = await Promise.all([
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
  ]);

  const session = sessionRes.data as unknown as SessionDetail | null;
  if (!session) notFound();
  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];

  return (
    <>
      <PageHeader
        title="Scan attendance"
        description={`${session.classes?.name ?? "—"} · ${formatDate(session.session_date)} · ${formatTimeRange(session.start_time, session.end_time)}`}
        action={
          <div className="flex shrink-0 gap-2">
            <KioskLaunchers sessionId={session.id} />
            <Link href="/admin/attendance">
              <Button variant="outline" size="sm">All sessions</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Scanner sessionId={session.id} />

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
              {attendance.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {a.members
                        ? `${a.members.last_name}, ${a.members.first_name}`
                        : "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(a.scanned_at).toLocaleTimeString()}
                      {" · "}
                      {a.method === "qr" ? "QR" : "Manual"}
                    </p>
                  </div>
                  {a.members?.level && (
                    <Badge tone="cobalt">{levelLabel(a.members.level)}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
