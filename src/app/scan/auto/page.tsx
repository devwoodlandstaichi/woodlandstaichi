import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/admin/ui";
import {
  formatDate,
  formatTimeInSchoolTz,
  formatTimeRange,
  levelLabel,
  todayIsoInSchoolTz,
} from "@/lib/format";
import { Scanner } from "@/app/admin/attendance/scan/[id]/scanner";
import { ExitKiosk } from "@/app/scan/[id]/exit-kiosk";
import { Clock } from "@/app/scan/[id]/clock";
import { KioskAutoRefresh } from "@/app/scan/[id]/auto-refresh";
import { Countdown } from "@/components/kiosk/countdown";
import { KioskStateRefresher } from "@/components/kiosk/state-refresher";
import { isKioskPinSet } from "@/lib/settings/kiosk-pin";
import {
  KIOSK_CHECKIN_WINDOW_MINUTES,
  pickKioskState,
  sessionStartMs,
  type KioskSession,
} from "@/lib/kiosk/active-session";

export const metadata = {
  title: "Scan attendance — auto",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const ATMOSPHERE_PHOTOS = [
  "/photos/WTCD2023-9.jpg",
  "/photos/WTCD2023-8.jpg",
  "/photos/FloMKS-WTachiDay2019-10.jpg",
  "/photos/DSC_7640-XL.jpg",
] as const;

type SearchParams = Promise<{ location?: string }>;

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

export default async function KioskAutoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const location = (params.location ?? "").trim();

  const supabase = await createClient();
  const pinRequired = await isKioskPinSet();
  const todayIso = todayIsoInSchoolTz();

  // All of today's sessions at this location, ordered by start_time.
  const { data } = await supabase
    .from("class_sessions")
    .select(
      "id,session_date,start_time,end_time,classes!inner(name,level,location)",
    )
    .eq("session_date", todayIso)
    .order("start_time", { ascending: true });

  type Raw = KioskSession;
  const allToday = ((data ?? []) as unknown as Raw[]).filter((s) => {
    if (!location) return true;
    return (s.classes?.location ?? "").toLowerCase() === location.toLowerCase();
  });

  // Server component is allowed to read wall-clock time on each
  // render — the lint rule is conservative about purity in client
  // components. We re-render via KioskStateRefresher on transitions.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const state = pickKioskState(allToday, now);

  return (
    <KioskShell pinRequired={pinRequired}>
      {state.kind === "active" && (
        <ActiveView
          session={state.session}
          closesAtMs={state.closesAtMs}
          allToday={allToday}
          location={location}
        />
      )}
      {state.kind === "closed" && (
        <ClosedView next={state.next} nextStartsAtMs={state.nextStartsAtMs} />
      )}
      {state.kind === "done" && <DoneView />}
    </KioskShell>
  );
}

// =============================================================================
// Shell — atmosphere photo, header, footer. Wraps every state view so
// the kiosk feels consistent through transitions.
// =============================================================================

function KioskShell({
  pinRequired,
  children,
}: {
  pinRequired: boolean;
  children: React.ReactNode;
}) {
  // Deterministic atmosphere photo so it doesn't flicker between refreshes.
  const photo = ATMOSPHERE_PHOTOS[new Date().getDate() % ATMOSPHERE_PHOTOS.length];

  return (
    <div className="relative min-h-svh overflow-hidden">
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

      <span
        aria-hidden
        className="pointer-events-none absolute right-0 md:right-6 top-1/2 -translate-y-1/2 hidden md:block font-display leading-none select-none text-foreground/[0.10] text-[clamp(18rem,30vw,33rem)] tracking-tighter"
      >
        靜
      </span>

      <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-4 py-5 md:px-8 md:py-8">
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
            <ExitKiosk pinRequired={pinRequired} />
          </div>
        </header>

        {children}

        <footer className="mt-8 flex items-center justify-between border-t border-foreground/8 pt-4 text-[11px] text-muted-foreground">
          <p className="italic font-display text-sm">Meditation in motion.</p>
          <Link href="/admin/attendance" className="hover:text-foreground">
            Back to admin
          </Link>
        </footer>
      </div>
    </div>
  );
}

// =============================================================================
// Active — same scanner layout as /scan/[id], plus the check-in
// timer + a state-refresher pinned to the close moment.
// =============================================================================

async function ActiveView({
  session,
  closesAtMs,
  allToday,
  location,
}: {
  session: KioskSession;
  closesAtMs: number;
  allToday: KioskSession[];
  location: string;
}) {
  void location; // accepted to preserve closure shape if we use it later
  void allToday;
  const supabase = await createClient();

  const [attRes, rsvpRes] = await Promise.all([
    supabase
      .from("attendance")
      .select(
        "id,scanned_at,method,members(id,first_name,last_name,nickname,level)",
      )
      .eq("class_session_id", session.id)
      .order("scanned_at", { ascending: false })
      .limit(80),
    supabase
      .from("session_rsvps")
      .select(
        "id,members:member_id(id,first_name,last_name,nickname,level)",
      )
      .eq("class_session_id", session.id)
      .eq("status", "approved"),
  ]);

  const attendance = (attRes.data ?? []) as unknown as AttendanceRow[];
  type ApprovedRow = {
    id: string;
    members:
      | AttendanceRow["members"]
      | AttendanceRow["members"][]
      | null;
  };
  const approvedRows = (rsvpRes.data ?? []) as unknown as ApprovedRow[];

  const attByMember = new Map<string, AttendanceRow>();
  for (const a of attendance) {
    if (a.members?.id && !attByMember.has(a.members.id)) {
      attByMember.set(a.members.id, a);
    }
  }

  const approvedList = approvedRows
    .map((r) => {
      const m = Array.isArray(r.members) ? r.members[0] ?? null : r.members;
      if (!m) return null;
      const att = attByMember.get(m.id) ?? null;
      return { member: m, attendance: att };
    })
    .filter(
      (x): x is {
        member: NonNullable<AttendanceRow["members"]>;
        attendance: AttendanceRow | null;
      } => !!x,
    )
    .sort((a, b) => {
      if (a.attendance && !b.attendance) return -1;
      if (!a.attendance && b.attendance) return 1;
      if (a.attendance && b.attendance) {
        return (
          new Date(b.attendance.scanned_at).getTime() -
          new Date(a.attendance.scanned_at).getTime()
        );
      }
      const an = `${a.member.first_name} ${a.member.last_name}`;
      const bn = `${b.member.first_name} ${b.member.last_name}`;
      return an.localeCompare(bn);
    });

  const approvedMemberIds = new Set(approvedList.map((x) => x.member.id));
  const checkedInCount = approvedList.filter((x) => x.attendance).length;
  const walkIns = attendance.filter(
    (a) => a.members?.id && !approvedMemberIds.has(a.members.id),
  );

  return (
    <>
      {/* Refresh at the moment this session closes so we transition
          to the closed view (or the next session) immediately. */}
      <KioskStateRefresher transitionAtMs={closesAtMs} />

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
          <span className="font-mono text-sm tabular-nums text-foreground/70">
            Check-in closes in{" "}
            <Countdown
              deadlineMs={closesAtMs}
              expiredLabel="0:00"
              tone="warning"
            />
          </span>
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

      <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_360px]">
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

        <aside className="flex flex-col gap-5 self-start">
          <KioskAutoRefresh sessionId={session.id} />

          <RosterCard
            title="Approved roster"
            eyebrow={
              approvedList.length === 0
                ? "No RSVPs today"
                : `${checkedInCount} of ${approvedList.length} checked in`
            }
            empty="No one requested to attend this session."
            ariaLabel="Approved attendees"
          >
            {approvedList.map((row) => {
              const m = row.member;
              const initials =
                `${m.first_name[0] ?? ""}${m.last_name[0] ?? ""}`.toUpperCase();
              const displayName =
                m.nickname ?? `${m.first_name} ${m.last_name}`;
              const time = row.attendance
                ? formatTimeInSchoolTz(row.attendance.scanned_at, {
                    seconds: false,
                  })
                : null;
              return (
                <li
                  key={m.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    row.attendance
                      ? "bg-jade/8"
                      : "bg-transparent text-foreground/70"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium tracking-wide ${
                      row.attendance
                        ? "bg-jade/20 text-jade"
                        : "bg-foreground/8 text-foreground/50"
                    }`}
                  >
                    {row.attendance ? "✓" : initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {displayName}
                    </p>
                    <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {row.attendance
                        ? `${time}${
                            row.attendance.method === "manual"
                              ? " · manual"
                              : ""
                          }`
                        : "Pending arrival"}
                    </p>
                  </div>
                </li>
              );
            })}
          </RosterCard>

          <RosterCard
            title="Walk-ins"
            eyebrow={
              walkIns.length === 0
                ? "None yet"
                : `${walkIns.length} not on the list`
            }
            empty=""
            ariaLabel="Walk-in attendees"
            tone="vermillion"
          >
            {walkIns.map((a) => {
              const m = a.members;
              if (!m) return null;
              const initials =
                `${m.first_name[0] ?? ""}${m.last_name[0] ?? ""}`.toUpperCase();
              const displayName =
                m.nickname ?? `${m.first_name} ${m.last_name}`;
              const time = formatTimeInSchoolTz(a.scanned_at, {
                seconds: false,
              });
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 bg-vermillion/5 px-4 py-3"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vermillion/15 text-xs font-medium tracking-wide text-vermillion"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {displayName}
                    </p>
                    <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {time}
                      {a.method === "manual" ? " · manual" : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </RosterCard>
        </aside>
      </div>
    </>
  );
}

function RosterCard({
  title,
  eyebrow,
  empty,
  ariaLabel,
  tone,
  children,
}: {
  title: string;
  eyebrow: string;
  empty: string;
  ariaLabel: string;
  tone?: "vermillion";
  children: React.ReactNode;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  const hasChildren = childArray.some(
    (c) => c !== null && c !== undefined && c !== false,
  );
  const accent =
    tone === "vermillion"
      ? "border-vermillion/25 bg-vermillion/[0.04]"
      : "border-foreground/10 bg-card/85";
  return (
    <section
      aria-label={ariaLabel}
      className={`overflow-hidden rounded-2xl border ${accent} backdrop-blur-sm shadow-sm`}
    >
      <div className="flex items-baseline justify-between border-b border-foreground/10 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight">
            {title}
          </h2>
          <p className="mt-0.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {eyebrow}
          </p>
        </div>
      </div>
      {!hasChildren && empty ? (
        <p className="px-5 py-8 text-center text-sm italic text-muted-foreground">
          {empty}
        </p>
      ) : !hasChildren ? null : (
        <ul className="max-h-[40vh] divide-y divide-foreground/5 overflow-y-auto">
          {children}
        </ul>
      )}
    </section>
  );
}

// =============================================================================
// Closed — between sessions. Show the next one + a countdown.
// =============================================================================

function ClosedView({
  next,
  nextStartsAtMs,
}: {
  next: KioskSession;
  nextStartsAtMs: number;
}) {
  return (
    <>
      <KioskStateRefresher transitionAtMs={nextStartsAtMs} />

      <section className="flex flex-1 flex-col items-center justify-center text-center px-4 py-12">
        <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground mb-4">
          <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
          Class is closed for check-in
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-tight max-w-2xl">
          Next session starts in{" "}
          <span className="italic text-vermillion font-mono tabular-nums">
            <Countdown
              deadlineMs={nextStartsAtMs}
              expiredLabel="opening…"
            />
          </span>
        </h1>

        <div className="mt-12 max-w-xl">
          <p className="text-xs uppercase tracking-[0.32em] text-foreground/55 mb-3">
            Up next
          </p>
          <h2 className="font-display text-2xl md:text-3xl tracking-tight">
            {next.classes?.name ?? "—"}
          </h2>
          <p className="mt-3 text-base text-foreground/75 font-mono tabular-nums">
            {formatTimeRange(next.start_time, next.end_time)}
          </p>
          {next.classes?.location && (
            <p className="mt-1 text-sm text-muted-foreground">
              {next.classes.location}
            </p>
          )}
          {next.classes?.level && (
            <p className="mt-4">
              <Badge tone="cobalt">{levelLabel(next.classes.level)}</Badge>
            </p>
          )}
        </div>
      </section>
    </>
  );
}

// =============================================================================
// Done — no more sessions today.
// =============================================================================

function DoneView() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center px-4 py-12">
      <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground mb-4">
        <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
        All sessions complete
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-tight max-w-2xl">
        All check-ins for today are{" "}
        <span className="italic text-vermillion">complete.</span>
      </h1>
      <p className="mt-6 text-base text-foreground/65 max-w-md leading-relaxed">
        Thank you for practicing with us.
      </p>
    </section>
  );
}

// Re-export so the URL stays evaluatable at build time even if this
// module is referenced via dev hot-reload. KIOSK_CHECKIN_WINDOW_MINUTES
// + sessionStartMs are imported by other files; this `void`-touch keeps
// them in the bundle if tree-shaking ever gets aggressive.
void KIOSK_CHECKIN_WINDOW_MINUTES;
void sessionStartMs;
