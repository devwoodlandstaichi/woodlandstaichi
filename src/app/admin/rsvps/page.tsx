import Link from "next/link";
import { Calendar, Hourglass, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import {
  formatDate,
  formatTimeRange,
  levelLabel,
  todayIsoInSchoolTz,
  type DayOfWeek,
} from "@/lib/format";

export const metadata = { title: "RSVPs awaiting review" };
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

type RsvpRow = {
  id: string;
  status: "pending" | "approved" | "waitlisted" | "rejected" | "cancelled";
  requested_at: string;
  members: {
    first_name: string;
    last_name: string;
    email: string;
    level: string;
  } | null;
  class_sessions: {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    capacity: number | null;
    classes:
      | {
          name: string;
          location: string | null;
          day_of_week: DayOfWeek;
          level: string;
          capacity: number | null;
        }
      | { name: string; location: string | null; day_of_week: DayOfWeek; level: string; capacity: number | null }[]
      | null;
  } | null;
};

type SearchParams = Promise<{ status?: string }>;

type Status = "pending" | "approved" | "waitlisted" | "rejected" | "cancelled" | "all";

export default async function GlobalRsvpQueue({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: Status = (() => {
    const v = params.status;
    if (
      v === "approved" ||
      v === "waitlisted" ||
      v === "rejected" ||
      v === "cancelled" ||
      v === "all"
    )
      return v;
    return "pending";
  })();

  const supabase = await createClient();
  const todayIso = todayIsoInSchoolTz();

  let query = supabase
    .from("session_rsvps")
    .select(
      "id, status, requested_at, members:member_id(first_name, last_name, email, level), class_sessions:class_session_id(id, session_date, start_time, end_time, capacity, classes(name, location, day_of_week, level, capacity))",
    );

  if (status !== "all") query = query.eq("status", status);

  // Hide rows whose underlying session is in the past — clutter doesn't
  // help admins. (Cancelled/rejected too: those are historical.)
  query = query
    .gte("class_sessions.session_date", todayIso)
    .order("requested_at", { ascending: true });

  const { data } = await query;
  const rows = ((data ?? []) as unknown as RsvpRow[]).filter(
    (r) => r.class_sessions && r.members,
  );

  // Group by session for the pending view; flat list for everything else.
  type Bucket = { sessionId: string; rsvps: RsvpRow[] };
  const buckets = new Map<string, Bucket>();
  for (const r of rows) {
    const sid = r.class_sessions?.id ?? "_";
    if (!buckets.has(sid)) buckets.set(sid, { sessionId: sid, rsvps: [] });
    buckets.get(sid)!.rsvps.push(r);
  }
  const grouped = Array.from(buckets.values());

  return (
    <>
      <PageHeader
        title="RSVPs awaiting review"
        description="Members across every upcoming session asking to attend. Open a session to approve or reject inline."
        helpTopic="rsvps"
      />

      <div className="-mx-4 flex shrink-0 flex-wrap items-center gap-3 border-b border-foreground/10 bg-background px-4 py-4 md:-mx-6 md:px-6">
        {(["pending", "approved", "waitlisted", "rejected", "all"] as const).map(
          (s) => {
            const active = status === s;
            const href = s === "pending" ? "/admin/rsvps" : `/admin/rsvps?status=${s}`;
            return (
              <Link
                key={s}
                href={href}
                className={
                  active
                    ? "inline-flex h-9 items-center rounded-full bg-foreground px-4 text-xs font-medium uppercase tracking-[0.16em] text-background"
                    : "inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-xs uppercase tracking-[0.16em] text-foreground/65 hover:text-foreground hover:border-foreground/30"
                }
              >
                {s}
              </Link>
            );
          },
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-4">
        {rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            {status === "pending"
              ? "Empty queue. Nothing waiting on you."
              : "No RSVPs match this filter."}
          </Card>
        ) : (
          <div className="grid gap-6">
            {grouped.map((b) => (
              <SessionGroup key={b.sessionId} bucket={b} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SessionGroup({ bucket }: { bucket: { sessionId: string; rsvps: RsvpRow[] } }) {
  const first = bucket.rsvps[0];
  const cs = first?.class_sessions;
  if (!cs) return null;
  const cls = Array.isArray(cs.classes)
    ? cs.classes[0] ?? null
    : cs.classes;
  if (!cls) return null;
  const cap = cs.capacity ?? cls.capacity ?? null;
  const dayName = DAY_LABEL[cls.day_of_week];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 bg-secondary/40 px-5 py-4">
        <div className="min-w-0">
          <Link
            href={`/admin/sessions/${cs.id}`}
            className="font-display text-base font-medium tracking-tight hover:text-vermillion"
          >
            {cls.name}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} aria-hidden /> {dayName},{" "}
              {formatDate(cs.session_date)}
            </span>
            <span className="font-mono tabular-nums">
              {formatTimeRange(cs.start_time, cs.end_time)}
            </span>
            {cls.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} aria-hidden /> {cls.location}
              </span>
            )}
            <Badge tone="cobalt">{levelLabel(cls.level)}</Badge>
            {cap !== null && (
              <span className="font-mono tabular-nums text-foreground/70">
                cap {cap}
              </span>
            )}
          </p>
        </div>
        <Link
          href={`/admin/sessions/${cs.id}`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-foreground/15 bg-background px-3 text-sm hover:border-foreground/30 hover:bg-foreground/5"
        >
          Open session →
        </Link>
      </div>

      <ul className="divide-y divide-foreground/5">
        {bucket.rsvps.map((r) => {
          const m = r.members!;
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {m.first_name} {m.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  <Badge tone="muted">{levelLabel(m.level)}</Badge>
                  <span className="mx-2">·</span>
                  {m.email}
                  <span className="mx-2">·</span>
                  Requested{" "}
                  {new Date(r.requested_at).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function StatusBadge({ status }: { status: RsvpRow["status"] }) {
  switch (status) {
    case "pending":
      return <Badge tone="vermillion">Pending</Badge>;
    case "approved":
      return <Badge tone="jade">Approved</Badge>;
    case "waitlisted":
      return (
        <Badge tone="cobalt">
          <Hourglass size={11} aria-hidden className="mr-1 inline-block" />
          Waitlist
        </Badge>
      );
    case "rejected":
      return <Badge tone="muted">Rejected</Badge>;
    case "cancelled":
      return <Badge tone="muted">Cancelled</Badge>;
  }
}
