import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/admin/ui";
import {
  addDaysIso,
  formatDate,
  formatTimeRange,
  levelLabel,
  todayIsoInSchoolTz,
  type DayOfWeek,
} from "@/lib/format";
import { MemberTabs } from "../tab-nav";
import { requestRsvp, cancelRsvp } from "./actions";

export const metadata: Metadata = {
  title: "Upcoming sessions — Woodlands Tai Chi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DAY_LABEL: Record<DayOfWeek, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

const TABS = [
  { href: "/members/me", label: "Profile" },
  { href: "/members/me/sessions", label: "Sessions" },
];

const FALLBACK_MATRIX: Record<string, string[]> = {
  instructor: ["instructor", "advanced", "intermediate", "beginners", "remedial", "play_only", "combined"],
  advanced: ["advanced", "intermediate", "beginners", "play_only", "combined"],
  intermediate: ["intermediate", "beginners", "play_only", "combined"],
  beginners: ["beginners", "remedial", "combined"],
};

// How far ahead we search for the member's next session. Longer than
// the previous 14-day window so a slow week doesn't leave the page
// empty — but we only ever surface the single soonest match.
const LOOKAHEAD_DAYS = 60;

type SessionRow = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
  newcomer_friendly: boolean;
  classes:
    | {
        name: string;
        location: string | null;
        level: string;
        capacity: number | null;
        day_of_week: DayOfWeek;
      }
    | null;
};

type OwnRsvp = {
  id: string;
  class_session_id: string;
  status: "pending" | "approved" | "waitlisted" | "rejected" | "cancelled";
  reviewer_note: string | null;
};

export default async function MemberSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/members/me/sessions");

  const { data: member } = await supabase
    .from("members")
    .select("id, status, level")
    .eq("user_id", user.id)
    .maybeSingle();

  // Inactive / waitlist / no-roster members see a notice and no list,
  // per the project rule that this feature is only for active members.
  if (!member || member.status !== "active") {
    return (
      <>
        <MemberTabs tabs={TABS} />
        <section className="mx-auto max-w-3xl px-6 py-12 md:px-10">
          <p className="text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-4">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-vermillion" />
            Sessions
          </p>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            Not quite yet.
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground/75">
            Self-serve session sign-up is open to active members. If your
            status looks off, please reply to one of our emails or write to{" "}
            <a
              href="mailto:info@woodlandstaichi.com"
              className="underline decoration-vermillion underline-offset-4"
            >
              info@woodlandstaichi.com
            </a>{" "}
            and we&rsquo;ll sort it.
          </p>
        </section>
      </>
    );
  }

  // Settings (cutoff + level matrix). app_settings is a single-row table.
  const { data: settings } = await supabase
    .from("app_settings")
    .select("rsvp_cutoff_minutes, rsvp_level_matrix")
    .maybeSingle();
  const cutoffMinutes = settings?.rsvp_cutoff_minutes ?? 240;
  const matrix =
    (settings?.rsvp_level_matrix as Record<string, string[]> | null) ??
    FALLBACK_MATRIX;
  const allowedClassLevels = matrix[member.level] ?? FALLBACK_MATRIX.beginners;

  // Window: today through today + LOOKAHEAD_DAYS days, anchored to
  // the school's local calendar so boundaries don't drift around UTC
  // midnight.
  const todayIso = todayIsoInSchoolTz();
  const endIso = addDaysIso(todayIso, LOOKAHEAD_DAYS);

  const { data: sessionsData } = await supabase
    .from("class_sessions")
    .select(
      "id, session_date, start_time, end_time, capacity, newcomer_friendly, classes!inner(name, location, level, capacity, day_of_week)",
    )
    .eq("accepting_rsvps", true)
    .gte("session_date", todayIso)
    .lt("session_date", endIso)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  const sessions = (sessionsData ?? []) as unknown as SessionRow[];

  // Filter: matrix-allowed level OR newcomer_friendly bypass; and the
  // RSVP cutoff (session start must be at least cutoff_minutes from now).
  // Server components are allowed to read wall-clock time on each render;
  // the lint rule is conservative about purity in client components.
  const cutoffMs = cutoffMinutes * 60 * 1000;
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const eligible = sessions.filter((s) => {
    if (!s.classes) return false;
    const allowed =
      allowedClassLevels.includes(s.classes.level) || s.newcomer_friendly;
    if (!allowed) return false;
    const startMs = new Date(`${s.session_date}T${s.start_time}`).getTime();
    return startMs - nowMs >= cutoffMs;
  });

  // We only render the single soonest eligible session — the member
  // sees one card at a time, takes the action, then comes back. Keeps
  // the page focused for the older audience.
  const next = eligible[0] ?? null;

  // Per-session approved count + member's own RSVP for the next
  // session, plus the member's RSVP history. History excludes any
  // session that's still in the eligible window so an upcoming
  // request doesn't appear as "past".
  const eligibleIds = new Set(eligible.map((s) => s.id));
  const [approvedRes, ownRes, historyRes] = await Promise.all([
    next
      ? supabase
          .from("session_rsvps")
          .select("class_session_id")
          .eq("status", "approved")
          .eq("class_session_id", next.id)
      : Promise.resolve({ data: [] as { class_session_id: string }[] }),
    next
      ? supabase
          .from("session_rsvps")
          .select("id, class_session_id, status, reviewer_note")
          .eq("member_id", member.id)
          .eq("class_session_id", next.id)
      : Promise.resolve({ data: [] as OwnRsvp[] }),
    supabase
      .from("session_rsvps")
      .select(
        "id, status, requested_at, reviewer_note, class_session_id, class_sessions:class_session_id(session_date, start_time, end_time, classes(name, location))",
      )
      .eq("member_id", member.id)
      .order("requested_at", { ascending: false })
      .limit(50),
  ]);

  const approvedCount = (approvedRes.data ?? []).length;
  const ownRsvp = ((ownRes.data ?? []) as OwnRsvp[])[0] ?? null;

  // History: any RSVP whose underlying session isn't in the currently
  // eligible window. Includes past dates and rejected/cancelled rows
  // that rolled out of the window.
  type HistoryRow = {
    id: string;
    status: OwnRsvp["status"];
    requested_at: string;
    reviewer_note: string | null;
    class_session_id: string;
    class_sessions: {
      session_date: string;
      start_time: string;
      end_time: string;
      classes:
        | { name: string; location: string | null }
        | { name: string; location: string | null }[]
        | null;
    } | null;
  };
  const history = ((historyRes.data ?? []) as unknown as HistoryRow[]).filter(
    (h) => !eligibleIds.has(h.class_session_id),
  );

  return (
    <>
      <MemberTabs tabs={TABS} />

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-4">
          <span className="mr-3 inline-block h-px w-8 align-middle bg-vermillion" />
          Up next
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
          Your next{" "}
          <span className="italic text-vermillion">session.</span>
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground/70">
          Pick this date if you can come. Requests close{" "}
          {Math.round(cutoffMinutes / 60)} hour
          {cutoffMinutes === 60 ? "" : "s"} before the start time. After
          you&rsquo;ve responded, the next one will appear here.
        </p>

        {next === null ? (
          <p className="mt-12 max-w-prose rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm text-muted-foreground">
            Nothing open right now. Check back tomorrow — new dates appear as
            instructors set the term schedule.
          </p>
        ) : (
          (() => {
            const c = next.classes;
            const cap = next.capacity ?? c?.capacity ?? null;
            const isFull = cap !== null && approvedCount >= cap;
            return (
              <ul className="mt-10 grid gap-4">
                <SessionCard
                  s={next}
                  cap={cap}
                  approved={approvedCount}
                  isFull={isFull}
                  own={ownRsvp}
                />
              </ul>
            );
          })()
        )}

        {history.length > 0 && (
          <details className="mt-12 group">
            <summary className="cursor-pointer list-none text-[11px] uppercase tracking-[0.32em] text-foreground/55 hover:text-foreground">
              <span className="mr-3 inline-block h-px w-6 align-middle bg-foreground/40 group-open:bg-vermillion transition-colors" />
              Past requests · {history.length}
            </summary>
            <ul className="mt-5 grid gap-2">
              {history.map((h) => (
                <HistoryRow key={h.id} row={h} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </>
  );
}

type HistoryDisplayRow = {
  id: string;
  status: OwnRsvp["status"];
  requested_at: string;
  reviewer_note: string | null;
  class_sessions: {
    session_date: string;
    start_time: string;
    end_time: string;
    classes:
      | { name: string; location: string | null }
      | { name: string; location: string | null }[]
      | null;
  } | null;
};

function HistoryRow({ row }: { row: HistoryDisplayRow }) {
  const cs = row.class_sessions;
  const cls = cs
    ? Array.isArray(cs.classes)
      ? cs.classes[0] ?? null
      : cs.classes
    : null;
  const tone =
    row.status === "approved"
      ? "jade"
      : row.status === "rejected"
        ? "vermillion"
        : row.status === "waitlisted"
          ? "cobalt"
          : "muted";
  const label =
    row.status === "approved"
      ? "Attended / approved"
      : row.status === "rejected"
        ? "Not approved"
        : row.status === "waitlisted"
          ? "Waitlisted"
          : row.status === "cancelled"
            ? "Cancelled"
            : "Pending";
  return (
    <li className="rounded-xl border border-foreground/8 bg-card/60 p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-foreground/85">{cls?.name ?? "—"}</p>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {cs
          ? `${formatDate(cs.session_date)} · ${formatTimeRange(
              cs.start_time,
              cs.end_time,
            )}`
          : "—"}
        {cls?.location ? ` · ${cls.location}` : ""}
      </p>
      {row.status === "rejected" && row.reviewer_note && (
        <p className="mt-2 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs text-foreground/70">
          <span className="font-medium text-foreground/85">Note: </span>
          {row.reviewer_note}
        </p>
      )}
    </li>
  );
}

function SessionCard({
  s,
  cap,
  approved,
  isFull,
  own,
}: {
  s: SessionRow;
  cap: number | null;
  approved: number;
  isFull: boolean;
  own: OwnRsvp | null;
}) {
  const c = s.classes!;
  const dayLabel = DAY_LABEL[c.day_of_week];
  return (
    <li className="rounded-2xl border border-foreground/10 bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.32em] text-foreground/55">
            <Calendar
              size={12}
              aria-hidden
              className="mr-1.5 inline-block align-[-2px]"
            />
            {dayLabel}, {formatDate(s.session_date)}
            <span className="mx-2">·</span>
            <span className="font-mono tabular-nums normal-case tracking-normal text-foreground/85">
              {formatTimeRange(s.start_time, s.end_time)}
            </span>
          </p>
          <h2 className="mt-2 font-display text-xl tracking-tight md:text-2xl">
            {c.name}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/70">
            <Badge tone="cobalt">{levelLabel(c.level)}</Badge>
            {s.newcomer_friendly && (
              <Badge tone="vermillion">Welcoming</Badge>
            )}
            {c.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} aria-hidden /> {c.location}
              </span>
            )}
            <span className="flex items-center gap-1 font-mono tabular-nums">
              <Users size={12} aria-hidden /> {approved}
              {cap !== null && (
                <>
                  <span className="text-foreground/40">/</span>
                  <span>{cap}</span>
                </>
              )}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <RsvpAction
            sessionId={s.id}
            isFull={isFull}
            cap={cap}
            own={own}
          />
        </div>
      </div>

      {own?.status === "rejected" && own.reviewer_note && (
        <p className="mt-4 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs text-foreground/70">
          <span className="font-medium text-foreground/85">
            Note from the school:{" "}
          </span>
          {own.reviewer_note}
        </p>
      )}
    </li>
  );
}

function RsvpAction({
  sessionId,
  isFull,
  cap,
  own,
}: {
  sessionId: string;
  isFull: boolean;
  cap: number | null;
  own: OwnRsvp | null;
}) {
  // No prior request — submit a new one.
  if (!own || own.status === "cancelled") {
    if (own?.status === "cancelled") {
      return (
        <p className="text-xs text-muted-foreground">
          You cancelled this request — contact the school to re-open.
        </p>
      );
    }
    return (
      <form action={requestRsvp}>
        <input type="hidden" name="session_id" value={sessionId} />
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-vermillion"
        >
          {isFull && cap !== null ? "Request waitlist" : "Request to attend"}
        </button>
      </form>
    );
  }

  if (own.status === "pending") {
    return (
      <div className="flex flex-col items-end gap-2">
        <Badge tone="vermillion">Pending review</Badge>
        <CancelButton id={own.id} label="Cancel request" />
      </div>
    );
  }
  if (own.status === "approved") {
    return (
      <div className="flex flex-col items-end gap-2">
        <Badge tone="jade">You&rsquo;re in</Badge>
        <CancelButton id={own.id} label="Can&rsquo;t make it?" />
      </div>
    );
  }
  if (own.status === "waitlisted") {
    return (
      <div className="flex flex-col items-end gap-2">
        <Badge tone="cobalt">On waitlist</Badge>
        <CancelButton id={own.id} label="Withdraw" />
      </div>
    );
  }
  // rejected
  return <Badge tone="muted">Not approved</Badge>;
}

function CancelButton({ id, label }: { id: string; label: string }) {
  return (
    <form action={cancelRsvp}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.18em] text-foreground/55 underline-offset-4 hover:text-vermillion hover:underline"
      >
        {label}
      </button>
    </form>
  );
}
