import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, PageHeader } from "@/components/admin/ui";
import { dayLabel, formatDate, formatTimeRange, levelLabel } from "@/lib/format";
import { markPaid, markPending, markRefunded, markWaived } from "./actions";
import { RegistrationFilters, type PaymentStatus } from "./filters";

export const metadata = { title: "Registrations" };
export const dynamic = "force-dynamic";

const PAYMENT_OPTIONS = ["pending", "paid", "waived", "refunded"] as const;

const PAYMENT_TONE: Record<PaymentStatus, "vermillion" | "jade" | "cobalt" | "muted"> = {
  pending: "vermillion",
  paid: "jade",
  waived: "cobalt",
  refunded: "muted",
};

type Row = {
  id: string;
  shirt_size: string | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  payment_received_at: string | null;
  registered_at: string;
  notes: string | null;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  } | null;
  classes: {
    name: string;
    level: string;
    location: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  } | null;
};

type SearchParams = Promise<{ status?: string }>;

function isStatus(v: string | undefined): v is PaymentStatus {
  return !!v && (PAYMENT_OPTIONS as readonly string[]).includes(v);
}

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : "pending";

  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select(
      "id,shirt_size,payment_method,payment_status,payment_received_at,registered_at,notes,members(id,first_name,last_name,email,status),classes(name,level,location,day_of_week,start_time,end_time)",
    )
    .eq("payment_status", status)
    .order("registered_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Pending payments are the queue you work daily — mark paid once funds land and the member auto-activates."
      />

      <RegistrationFilters status={status} />

      {rows.length === 0 ? (
        <EmptyRegistrations status={status} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          {/* Sticky lives on each <th>, not <thead>, because <thead>+z-index
              doesn't reliably stack above <tbody> rows in tables. */}
          <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">Member</th>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">Class</th>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">Shirt</th>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">Method</th>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">Registered</th>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">Payment</th>
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 shadow-[inset_0_-1px_0_var(--border)]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-foreground/5 last:border-0 align-top"
              >
                <td className="px-4 py-3">
                  {r.members ? (
                    <Link
                      href={`/admin/members/${r.members.id}`}
                      className="font-medium hover:text-vermillion"
                    >
                      {r.members.last_name}, {r.members.first_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                  {r.members?.email && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.members.email}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.classes?.name ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.classes?.day_of_week
                      ? dayLabel(r.classes.day_of_week)
                      : "—"}
                    {r.classes?.start_time && r.classes?.end_time
                      ? ` · ${formatTimeRange(
                          r.classes.start_time,
                          r.classes.end_time,
                        )}`
                      : ""}
                  </p>
                  {r.classes?.level && (
                    <p className="mt-1">
                      <Badge tone="cobalt">{levelLabel(r.classes.level)}</Badge>
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">{r.shirt_size ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.payment_method ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(r.registered_at.slice(0, 10))}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={PAYMENT_TONE[r.payment_status]}>
                    {r.payment_status}
                  </Badge>
                  {r.payment_received_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(r.payment_received_at.slice(0, 10))}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ActionButtons id={r.id} status={r.payment_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div className="-mx-4 shrink-0 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "registration" : "registrations"}.
        </p>
      </div>
    </>
  );
}

// Status-aware empty state. The standing 空 (kong, "empty / open
// sky") backdrop turns the empty queue into a small Tai Chi joke:
// Wuji is the void from which the first move arises. Each status
// gets a distinct line so the founder gets a quiet wink rather
// than the same generic "No X registrations" four ways.
const EMPTY_COPY: Record<
  PaymentStatus,
  { headline: string; italic: string; sub: string }
> = {
  pending: {
    headline: "Inbox zero,",
    italic: "the queue is at rest.",
    sub: "Mark something paid and the member auto-activates. Until then, deep breaths.",
  },
  paid: {
    headline: "All squared up,",
    italic: "no payments outstanding.",
    sub: "New ones will land here the moment a member commits to a class.",
  },
  waived: {
    headline: "Nothing waived,",
    italic: "everyone paid the shirt fee.",
    sub: "If you ever comp a registration, it'll show up here.",
  },
  refunded: {
    headline: "Nothing reversed,",
    italic: "money flowed the right way.",
    sub: "Refunds are rare. That's the goal.",
  },
};

function EmptyRegistrations({ status }: { status: PaymentStatus }) {
  const copy = EMPTY_COPY[status];
  return (
    <div className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight leading-[1.1]">
          {copy.headline}{" "}
          <span className="italic text-vermillion">{copy.italic}</span>
        </h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          {copy.sub}
        </p>
      </div>
    </div>
  );
}

function ActionButtons({
  id,
  status,
}: {
  id: string;
  status: PaymentStatus;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status !== "paid" && (
        <form action={markPaid}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm">
            Mark paid
          </Button>
        </form>
      )}
      {status !== "waived" && (
        <form action={markWaived}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="outline" size="sm">
            Waive
          </Button>
        </form>
      )}
      {status !== "pending" && (
        <form action={markPending}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="ghost" size="sm">
            Reset to pending
          </Button>
        </form>
      )}
      {status === "paid" && (
        <form action={markRefunded}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="ghost" size="sm">
            Refund
          </Button>
        </form>
      )}
    </div>
  );
}

