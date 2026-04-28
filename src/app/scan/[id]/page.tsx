import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/admin/ui";
import { formatDate, formatTimeRange, levelLabel } from "@/lib/format";
import { Scanner } from "@/app/admin/attendance/scan/[id]/scanner";
import { ExitKiosk } from "./exit-kiosk";

export const metadata = {
  title: "Scan attendance",
  robots: { index: false, follow: false },
};
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
  members: {
    id: string;
    first_name: string;
    last_name: string;
    level: string;
  } | null;
};

export default async function KioskScanPage({
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
      .select("id,scanned_at,method,members(id,first_name,last_name,level)")
      .eq("class_session_id", id)
      .order("scanned_at", { ascending: false })
      .limit(50),
  ]);

  const session = sessionRes.data as unknown as SessionDetail | null;
  if (!session) notFound();
  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 py-4 md:px-8 md:py-6">
      {/* Compact bar — class info on left, exit on right. No nav links. */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground mb-1">
            <span className="inline-block h-px w-6 align-middle bg-vermillion mr-2" />
            Attendance
          </p>
          <h1 className="font-display text-xl md:text-2xl font-medium tracking-tight truncate">
            {session.classes?.name ?? "—"}
          </h1>
          <p className="mt-0.5 text-xs md:text-sm text-muted-foreground">
            {formatDate(session.session_date)} ·{" "}
            {formatTimeRange(session.start_time, session.end_time)}
            {session.classes?.location ? ` · ${session.classes.location}` : ""}
          </p>
        </div>
        <ExitKiosk />
      </header>

      {/* Two-column layout matching the regular scanner page,
          but without the surrounding admin chrome. */}
      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Scanner sessionId={session.id} />

        <aside className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
          <div className="border-b border-foreground/10 px-4 py-3 flex items-baseline justify-between">
            <h2 className="font-display text-base font-medium tracking-tight">
              Scanned today
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {attendance.length}
            </span>
          </div>
          {attendance.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted-foreground">
              No one scanned in yet.
            </p>
          ) : (
            <ul className="divide-y divide-foreground/5 max-h-[60vh] overflow-y-auto">
              {attendance.map((a) => (
                <li
                  key={a.id}
                  className="px-4 py-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate text-sm">
                      {a.members
                        ? `${a.members.last_name}, ${a.members.first_name}`
                        : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(a.scanned_at).toLocaleTimeString()} ·{" "}
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
        </aside>
      </div>

      <footer className="mt-4 text-center text-[11px] text-muted-foreground">
        Kiosk mode · Refresh ends the kiosk session ·{" "}
        <Link href="/admin/attendance" className="hover:text-foreground">
          Back to admin
        </Link>
      </footer>
    </div>
  );
}
