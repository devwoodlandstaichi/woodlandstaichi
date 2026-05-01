import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/admin/ui";
import {
  formatDate,
  formatTimeRange,
  levelLabel,
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

const VISIBLE_DAYS = 14;

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

  // Window: today through today + 14 days.
  const todayIso = new Date().toISOString().slice(0, 10);
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() + VISIBLE_DAYS);
  const endIso = endDate.toISOString().slice(0, 10);

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
  const visible = sessions.filter((s) => {
    if (!s.classes) return false;
    const allowed =
      allowedClassLevels.includes(s.classes.level) || s.newcomer_friendly;
    if (!allowed) return false;
    const startMs = new Date(`${s.session_date}T${s.start_time}`).getTime();
    return startMs - nowMs >= cutoffMs;
  });

  // Per-session approved counts + member's own RSVP status.
  const sessionIds = visible.map((s) => s.id);
  const [approvedRes, ownRes] = await Promise.all([
    sessionIds.length > 0
      ? supabase
          .from("session_rsvps")
          .select("class_session_id")
          .eq("status", "approved")
          .in("class_session_id", sessionIds)
      : Promise.resolve({ data: [] as { class_session_id: string }[] }),
    sessionIds.length > 0
      ? supabase
          .from("session_rsvps")
          .select("id, class_session_id, status, reviewer_note")
          .eq("member_id", member.id)
          .in("class_session_id", sessionIds)
      : Promise.resolve({ data: [] as OwnRsvp[] }),
  ]);

  const approvedByMap = new Map<string, number>();
  for (const r of (approvedRes.data ?? []) as { class_session_id: string }[]) {
    approvedByMap.set(
      r.class_session_id,
      (approvedByMap.get(r.class_session_id) ?? 0) + 1,
    );
  }
  const ownByMap = new Map<string, OwnRsvp>();
  for (const r of (ownRes.data ?? []) as OwnRsvp[]) {
    ownByMap.set(r.class_session_id, r);
  }

  return (
    <>
      <MemberTabs tabs={TABS} />

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
        <p className="text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-4">
          <span className="mr-3 inline-block h-px w-8 align-middle bg-vermillion" />
          Next two weeks
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
          Sessions you can{" "}
          <span className="italic text-vermillion">request.</span>
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground/70">
          Pick the dates you can come. We&rsquo;ll review and email everyone
          for the session at once. Requests close{" "}
          {Math.round(cutoffMinutes / 60)} hour
          {cutoffMinutes === 60 ? "" : "s"} before the start time.
        </p>

        {visible.length === 0 ? (
          <p className="mt-12 max-w-prose rounded-2xl border border-foreground/10 bg-card p-8 text-center text-sm text-muted-foreground">
            Nothing open right now. Check back tomorrow — new dates appear as
            instructors set the term schedule.
          </p>
        ) : (
          <ul className="mt-10 grid gap-4">
            {visible.map((s) => {
              const c = s.classes;
              const cap = s.capacity ?? c?.capacity ?? null;
              const approved = approvedByMap.get(s.id) ?? 0;
              const isFull = cap !== null && approved >= cap;
              const own = ownByMap.get(s.id) ?? null;
              return (
                <SessionCard
                  key={s.id}
                  s={s}
                  cap={cap}
                  approved={approved}
                  isFull={isFull}
                  own={own}
                />
              );
            })}
          </ul>
        )}
      </section>
    </>
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
