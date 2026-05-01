import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Hourglass, Mail, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  formatDate,
  formatTimeRange,
  levelLabel,
  type DayOfWeek,
} from "@/lib/format";
import {
  approveRsvp,
  rejectRsvp,
  restoreRsvpToPending,
  sendApprovalRoster,
  sendRejectionRoster,
  waitlistRsvp,
} from "./actions";

export const metadata = { title: "Session detail" };
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
  reviewed_at: string | null;
  reviewer_note: string | null;
  notified_at: string | null;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    level: string;
  } | null;
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [sessionRes, rsvpsRes, scansRes] = await Promise.all([
    supabase
      .from("class_sessions")
      .select(
        "id, session_date, start_time, end_time, capacity, newcomer_friendly, accepting_rsvps, approvals_sent_at, rejections_sent_at, classes(name, location, day_of_week, level, capacity)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("session_rsvps")
      .select(
        "id, status, requested_at, reviewed_at, reviewer_note, notified_at, members:member_id(id, first_name, last_name, email, level)",
      )
      .eq("class_session_id", id)
      .order("requested_at", { ascending: true }),
    supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("class_session_id", id),
  ]);

  if (!sessionRes.data) notFound();

  const raw = sessionRes.data as unknown as {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    capacity: number | null;
    newcomer_friendly: boolean;
    accepting_rsvps: boolean;
    approvals_sent_at: string | null;
    rejections_sent_at: string | null;
    classes:
      | {
          name: string;
          location: string | null;
          day_of_week: DayOfWeek;
          level: string;
          capacity: number | null;
        }
      | {
          name: string;
          location: string | null;
          day_of_week: DayOfWeek;
          level: string;
          capacity: number | null;
        }[]
      | null;
  };
  const s = {
    ...raw,
    classes: Array.isArray(raw.classes) ? raw.classes[0] ?? null : raw.classes,
  };

  const rsvps = (rsvpsRes.data ?? []) as unknown as RsvpRow[];
  const scans = scansRes.count ?? 0;

  const cls = s.classes;
  const effectiveCapacity = s.capacity ?? cls?.capacity ?? null;
  const dayLabel = cls ? DAY_LABEL[cls.day_of_week] : "";

  const byStatus = {
    pending: rsvps.filter((r) => r.status === "pending"),
    approved: rsvps.filter((r) => r.status === "approved"),
    waitlisted: rsvps.filter((r) => r.status === "waitlisted"),
    rejected: rsvps.filter((r) => r.status === "rejected"),
    cancelled: rsvps.filter((r) => r.status === "cancelled"),
  };

  const approvedCount = byStatus.approved.length;
  const isFull =
    effectiveCapacity !== null && approvedCount >= effectiveCapacity;

  const unsentApprovals = byStatus.approved.filter((r) => !r.notified_at).length;
  const unsentRejections = byStatus.rejected.filter((r) => !r.notified_at).length;

  return (
    <>
      <PageHeader
        title={cls?.name ?? "Session"}
        description={
          cls
            ? `${dayLabel}, ${formatDate(s.session_date)} · ${formatTimeRange(
                s.start_time,
                s.end_time,
              )}${cls.location ? ` · ${cls.location}` : ""}`
            : ""
        }
        action={
          <Link href="/admin/sessions">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} aria-hidden /> Back to sessions
            </Button>
          </Link>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12">
        {/* Counter strip */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Approved / capacity
            </p>
            <p className="mt-2 font-display text-4xl tracking-tight">
              <span className={isFull ? "text-vermillion" : ""}>
                {approvedCount}
              </span>
              <span className="text-foreground/30"> / </span>
              <span>{effectiveCapacity ?? "∞"}</span>
            </p>
            {isFull && (
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-vermillion">
                Session is full — send approvals?
              </p>
            )}
          </Card>
          <Card className="p-5">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Waitlist · Pending
            </p>
            <p className="mt-2 font-display text-4xl tracking-tight">
              {byStatus.waitlisted.length}
              <span className="text-foreground/30"> / </span>
              {byStatus.pending.length}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Scans recorded
            </p>
            <p className="mt-2 font-display text-4xl tracking-tight">{scans}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cls?.level && (
                <Badge tone="cobalt">{levelLabel(cls.level)}</Badge>
              )}
              {s.newcomer_friendly && (
                <Badge tone="vermillion">Welcoming</Badge>
              )}
              {!s.accepting_rsvps && <Badge tone="muted">RSVPs closed</Badge>}
            </div>
          </Card>
        </div>

        {/* Roster send card */}
        <Card className="mb-8 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-medium tracking-tight">
                Roster emails
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Email everyone with a recent decision — approvals or rejections —
                in one BCC&apos;d note. Sent only when you click. Each member is
                only notified once per decision.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={sendApprovalRoster}>
                <input type="hidden" name="session_id" value={s.id} />
                <Button
                  type="submit"
                  size="sm"
                  disabled={unsentApprovals === 0}
                  className="inline-flex items-center gap-1.5"
                >
                  <Mail size={14} aria-hidden />
                  Send approvals
                  {unsentApprovals > 0 ? ` (${unsentApprovals})` : ""}
                </Button>
              </form>
              <form action={sendRejectionRoster}>
                <input type="hidden" name="session_id" value={s.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={unsentRejections === 0}
                  className="inline-flex items-center gap-1.5"
                >
                  <Mail size={14} aria-hidden />
                  Send rejections
                  {unsentRejections > 0 ? ` (${unsentRejections})` : ""}
                </Button>
              </form>
            </div>
          </div>
          <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <Stamp label="Approvals last sent" iso={s.approvals_sent_at} />
            <Stamp label="Rejections last sent" iso={s.rejections_sent_at} />
          </dl>
        </Card>

        {/* RSVP queues */}
        <RsvpSection
          title="Pending"
          eyebrow={`Pending · ${byStatus.pending.length}`}
          empty="Nothing waiting on you."
        >
          {byStatus.pending.map((r) => (
            <RsvpCard
              key={r.id}
              rsvp={r}
              sessionId={s.id}
              fullCapacity={isFull}
              showApprove
              showReject
              showWaitlist
            />
          ))}
        </RsvpSection>

        <RsvpSection
          title="Approved"
          eyebrow={`Approved · ${approvedCount}`}
          empty="Nobody approved yet."
        >
          {byStatus.approved.map((r) => (
            <RsvpCard
              key={r.id}
              rsvp={r}
              sessionId={s.id}
              fullCapacity={isFull}
              showRestore
              showWaitlist
            />
          ))}
        </RsvpSection>

        <RsvpSection
          title="Waitlist"
          eyebrow={`Waitlist · ${byStatus.waitlisted.length}`}
          empty="Empty waitlist."
        >
          {byStatus.waitlisted.map((r) => (
            <RsvpCard
              key={r.id}
              rsvp={r}
              sessionId={s.id}
              fullCapacity={isFull}
              showApprove
              showReject
              showRestore
            />
          ))}
        </RsvpSection>

        {byStatus.rejected.length > 0 && (
          <RsvpSection
            title="Rejected"
            eyebrow={`Rejected · ${byStatus.rejected.length}`}
            empty=""
          >
            {byStatus.rejected.map((r) => (
              <RsvpCard
                key={r.id}
                rsvp={r}
                sessionId={s.id}
                fullCapacity={isFull}
                showRestore
              />
            ))}
          </RsvpSection>
        )}

        {byStatus.cancelled.length > 0 && (
          <RsvpSection
            title="Cancelled"
            eyebrow={`Cancelled · ${byStatus.cancelled.length}`}
            empty=""
          >
            {byStatus.cancelled.map((r) => (
              <RsvpCard
                key={r.id}
                rsvp={r}
                sessionId={s.id}
                fullCapacity={isFull}
              />
            ))}
          </RsvpSection>
        )}
      </div>
    </>
  );
}

function RsvpSection({
  title,
  eyebrow,
  empty,
  children,
}: {
  title: string;
  eyebrow: string;
  empty: string;
  children: React.ReactNode;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  const hasChildren = childArray.some((c) => c !== null && c !== undefined);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden className="inline-block h-px w-6 bg-foreground/40" />
        <p className="text-[0.7rem] uppercase tracking-[0.32em] text-muted-foreground">
          {eyebrow}
        </p>
      </div>
      <h2 className="sr-only">{title}</h2>
      {hasChildren ? (
        <div className="grid gap-3">{children}</div>
      ) : empty ? (
        <Card className="p-5 text-sm text-muted-foreground">{empty}</Card>
      ) : null}
    </section>
  );
}

function RsvpCard({
  rsvp,
  sessionId,
  fullCapacity,
  showApprove,
  showReject,
  showWaitlist,
  showRestore,
}: {
  rsvp: RsvpRow;
  sessionId: string;
  fullCapacity: boolean;
  showApprove?: boolean;
  showReject?: boolean;
  showWaitlist?: boolean;
  showRestore?: boolean;
}) {
  const m = rsvp.members;
  const memberName = m
    ? `${m.first_name} ${m.last_name}`.trim()
    : "(Unknown member)";

  return (
    <Card className="p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-medium tracking-tight">
            {m ? (
              <Link
                href={`/admin/members/${m.id}`}
                className="hover:text-vermillion"
              >
                {memberName}
              </Link>
            ) : (
              memberName
            )}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {m && (
              <>
                <Badge tone="muted">{levelLabel(m.level)}</Badge>
                <span className="mx-2">·</span>
                {m.email}
                <span className="mx-2">·</span>
              </>
            )}
            Requested{" "}
            {new Date(rsvp.requested_at).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {rsvp.notified_at && (
              <>
                <span className="mx-2">·</span>
                <Badge tone="jade">Notified</Badge>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showApprove && (
            <form action={approveRsvp}>
              <input type="hidden" name="id" value={rsvp.id} />
              <input type="hidden" name="session_id" value={sessionId} />
              <Button
                type="submit"
                size="sm"
                disabled={fullCapacity}
                className="inline-flex items-center gap-1.5"
              >
                <Check size={14} aria-hidden />
                Approve
              </Button>
            </form>
          )}
          {showWaitlist && rsvp.status !== "waitlisted" && (
            <form action={waitlistRsvp}>
              <input type="hidden" name="id" value={rsvp.id} />
              <input type="hidden" name="session_id" value={sessionId} />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1.5"
              >
                <Hourglass size={14} aria-hidden />
                Waitlist
              </Button>
            </form>
          )}
          {showRestore && rsvp.status !== "pending" && (
            <form action={restoreRsvpToPending}>
              <input type="hidden" name="id" value={rsvp.id} />
              <input type="hidden" name="session_id" value={sessionId} />
              <Button type="submit" size="sm" variant="ghost">
                Move to pending
              </Button>
            </form>
          )}
          {showReject && (
            <details className="group">
              <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-md border border-vermillion/40 bg-background px-3 text-sm text-vermillion hover:bg-vermillion/10 hover:border-vermillion">
                <X size={14} aria-hidden /> Reject…
              </summary>
              <form
                action={rejectRsvp}
                className="mt-3 flex flex-col gap-2 md:w-72"
              >
                <input type="hidden" name="id" value={rsvp.id} />
                <input type="hidden" name="session_id" value={sessionId} />
                <textarea
                  name="reviewer_note"
                  rows={3}
                  placeholder="Optional note (sent in the rejection email batch)…"
                  className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus-visible:border-vermillion focus-visible:outline-none"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="self-end"
                >
                  Confirm reject
                </Button>
              </form>
            </details>
          )}
        </div>
      </div>

      {rsvp.reviewer_note && (
        <p className="mt-3 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Reviewer note: </span>
          {rsvp.reviewer_note}
        </p>
      )}
    </Card>
  );
}

function Stamp({ label, iso }: { label: string; iso: string | null }) {
  return (
    <div>
      <dt className="font-medium text-foreground/70">{label}</dt>
      <dd className="text-muted-foreground">
        {iso
          ? new Date(iso).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Never"}
      </dd>
    </div>
  );
}
