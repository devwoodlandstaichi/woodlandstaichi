import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import { dayLabel, formatDate, formatTimeRange, levelLabel } from "@/lib/format";
import { markPaid, markPending, markRefunded, markWaived } from "./actions";

export const metadata = { title: "Registrations" };
export const dynamic = "force-dynamic";

const PAYMENT_OPTIONS = ["pending", "paid", "waived", "refunded"] as const;
type PaymentStatus = (typeof PAYMENT_OPTIONS)[number];

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

      <Filters status={status} />

      {rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          No {status} registrations.
        </Card>
      ) : (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Shirt</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3" />
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
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "registration" : "registrations"}.
      </p>
    </>
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

function Filters({ status }: { status: PaymentStatus }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3"
      aria-label="Filter registrations"
    >
      <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        Payment status
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {PAYMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="h-10 rounded-md border border-input px-4 text-sm hover:bg-foreground/5"
      >
        Apply
      </button>
    </form>
  );
}
