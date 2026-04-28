import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { formatUsd } from "@/lib/store/catalog";
import { markOrderPaid, markOrderUnpaid } from "./actions";
import { OrderFilters, type OrderStatusFilter } from "./filters";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["unpaid", "paid", "cancelled", "all"] as const;
type Status = (typeof STATUS_OPTIONS)[number];

const STATUS_TONE: Record<
  "unpaid" | "paid" | "cancelled",
  "vermillion" | "jade" | "muted"
> = {
  unpaid: "vermillion",
  paid: "jade",
  cancelled: "muted",
};

type Row = {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  total_cents: number;
  payment_method: string;
  payment_status: "unpaid" | "paid" | "cancelled";
  paid_at: string | null;
  order_date: string;
  created_at: string;
  order_items: { id: string }[] | null;
};

type SearchParams = Promise<{ q?: string; status?: string }>;

function isStatus(v: string | undefined): v is Status {
  return !!v && (STATUS_OPTIONS as readonly string[]).includes(v);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status: Status = isStatus(params.status) ? params.status : "unpaid";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id,customer_first_name,customer_last_name,customer_email,total_cents,payment_method,payment_status,paid_at,order_date,created_at,order_items(id)",
    )
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("payment_status", status);
  if (q) {
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(
      [
        `customer_first_name.ilike.*${safe}*`,
        `customer_last_name.ilike.*${safe}*`,
        `customer_email.ilike.*${safe}*`,
      ].join(","),
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Submissions from the public store form. Mark paid once funds clear."
      />

      <OrderFilters q={q} status={status as OrderStatusFilter} />

      {rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          {q || status !== "unpaid"
            ? "No orders match these filters."
            : "No orders yet."}
        </Card>
      ) : (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const itemCount = r.order_items?.length ?? 0;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-foreground/5 last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${r.id}`}
                        className="font-medium hover:text-vermillion"
                      >
                        {r.customer_last_name}, {r.customer_first_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.customer_email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.payment_method.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      {formatUsd(r.total_cents)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(r.created_at.slice(0, 10))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[r.payment_status]}>
                        {r.payment_status}
                      </Badge>
                      {r.paid_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(r.paid_at.slice(0, 10))}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        id={r.id}
                        status={r.payment_status}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "order" : "orders"}.
      </p>
    </>
  );
}

function ActionButtons({
  id,
  status,
}: {
  id: string;
  status: "unpaid" | "paid" | "cancelled";
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status !== "paid" && (
        <form action={markOrderPaid}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm">
            Mark paid
          </Button>
        </form>
      )}
      {status === "paid" && (
        <form action={markOrderUnpaid}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="ghost" size="sm">
            Reset to unpaid
          </Button>
        </form>
      )}
      <Link
        href={`/admin/orders/${id}`}
        className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
      >
        View
      </Link>
    </div>
  );
}
