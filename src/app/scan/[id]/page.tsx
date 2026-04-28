import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/admin/ui";
import { formatDate, formatTimeRange, levelLabel } from "@/lib/format";
import { Scanner } from "@/app/admin/attendance/scan/[id]/scanner";
import { ExitKiosk } from "./exit-kiosk";
import { Clock } from "./clock";

export const metadata = {
  title: "Scan attendance",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// A few practice photos used as decorative atmosphere — picked from
// public/photos. The kiosk shows one as a softly-blurred backdrop so
// members feel they're walking into a familiar dojo aesthetic, not an
// admin tool.
const ATMOSPHERE_PHOTOS = [
  "/photos/WTCD2023-9.jpg",
  "/photos/WTCD2023-8.jpg",
  "/photos/FloMKS-WTachiDay2019-10.jpg",
  "/photos/DSC_7640-XL.jpg",
] as const;

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
    nickname: string | null;
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
      .select(
        "id,scanned_at,method,members(id,first_name,last_name,nickname,level)",
      )
      .eq("class_session_id", id)
      .order("scanned_at", { ascending: false })
      .limit(40),
  ]);

  const session = sessionRes.data as unknown as SessionDetail | null;
  if (!session) notFound();
  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];

  // Pick a deterministic atmosphere photo per session so it's stable
  // through re-renders but varies between sessions.
  const photo =
    ATMOSPHERE_PHOTOS[
      session.id.charCodeAt(0) % ATMOSPHERE_PHOTOS.length
    ];

  return (
    <div className="relative min-h-svh overflow-hidden">
      {/* Layered atmosphere — a softly blurred practice photo behind a
          parchment-and-vermillion gradient. Visible enough to set
          tone, low enough that the camera feed and scanned roster are
          easy to read. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src={photo}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25 blur-md scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/95 to-background/80" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 1100px 600px at 80% -10%, color-mix(in oklch, var(--vermillion-500) 8%, transparent), transparent 60%), radial-gradient(ellipse 900px 600px at 0% 110%, color-mix(in oklch, var(--cobalt-500) 8%, transparent), transparent 55%)",
          }}
        />
      </div>

      {/* Decorative vertical CJK accent — stillness */}
      <span
        aria-hidden
        className="vertical-mark pointer-events-none absolute right-6 top-32 hidden xl:block text-[10rem] leading-none select-none opacity-30"
      >
        靜
      </span>

      <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 py-5 md:px-8 md:py-8">
        {/* === Header ====================================================== */}
        <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <span className="relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ring-1 ring-foreground/15 shadow-sm">
              <Image
                src="/logo.jpg"
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            </span>
            <div>
              <p className="font-display text-xl tracking-tight font-medium">
                Woodlands{" "}
                <span className="italic text-vermillion">Tai Chi</span>
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Attendance · Kiosk mode
              </p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <Clock />
            <ExitKiosk />
          </div>
        </header>

        {/* === Class banner =============================================== */}
        <section className="mb-6">
          <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground mb-3">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Today&apos;s class
          </p>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight leading-tight">
              {session.classes?.name ?? "—"}
            </h1>
            {session.classes?.level && (
              <Badge tone="cobalt">{levelLabel(session.classes.level)}</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(session.session_date)} ·{" "}
            <span className="font-mono tabular-nums">
              {formatTimeRange(session.start_time, session.end_time)}
            </span>
            {session.classes?.location ? (
              <>
                {" "}
                ·{" "}
                <span className="text-foreground/80">
                  {session.classes.location}
                </span>
              </>
            ) : null}
          </p>
        </section>

        {/* === Scanner + roster grid ===================================== */}
        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Scanner — the existing client component, just wrapped in a
              richer card so it feels intentional rather than slapped down. */}
          <div className="relative">
            <Scanner sessionId={session.id} />
            <p className="mt-4 text-center text-sm text-muted-foreground italic max-w-md mx-auto leading-relaxed">
              Show your QR to the camera at the start of class.
              <br />
              <span className="text-foreground/60 not-italic text-xs uppercase tracking-[0.3em]">
                Empty the mind &middot; soften the body &middot; breathe
              </span>
            </p>
          </div>

          {/* Roster — feels like a welcoming "people here today" panel
              rather than a database log. */}
          <aside className="rounded-2xl border border-foreground/10 bg-card/85 backdrop-blur-sm overflow-hidden self-start shadow-sm">
            <div className="border-b border-foreground/10 px-5 py-4 flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-xl font-medium tracking-tight">
                  Welcome circle
                </h2>
                <p className="mt-0.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  In the dojo today
                </p>
              </div>
              <span className="font-display text-3xl font-medium tabular-nums leading-none">
                {attendance.length}
              </span>
            </div>
            {attendance.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground italic">
                No one has scanned in yet.
                <br />
                <span className="not-italic text-xs uppercase tracking-[0.3em] mt-2 block">
                  First arrival lights the room
                </span>
              </p>
            ) : (
              <ul className="divide-y divide-foreground/5 max-h-[58vh] overflow-y-auto">
                {attendance.map((a, i) => {
                  const m = a.members;
                  const initials = m
                    ? `${m.first_name[0] ?? ""}${m.last_name[0] ?? ""}`.toUpperCase()
                    : "—";
                  const displayName = m
                    ? m.nickname ?? `${m.first_name} ${m.last_name}`
                    : "—";
                  const time = new Date(a.scanned_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return (
                    <li
                      key={a.id}
                      className="px-4 py-3 flex items-center gap-3"
                      style={{
                        // Subtle stagger so the list feels alive on first paint
                        animationDelay: `${i * 30}ms`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vermillion/10 text-vermillion text-xs font-medium tracking-wide"
                      >
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {time}
                          {a.method === "manual" ? " · manual" : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>

        <footer className="mt-8 flex items-center justify-between border-t border-foreground/8 pt-4 text-[11px] text-muted-foreground">
          <p className="italic font-display text-sm">
            Meditation in motion.
          </p>
          <Link
            href="/admin/attendance"
            className="hover:text-foreground"
          >
            Back to admin
          </Link>
        </footer>
      </div>
    </div>
  );
}
