import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Textarea,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { formatUsd } from "@/lib/store/catalog";
import {
  cancelOrder,
  deleteOrder,
  markOrderPaid,
  markOrderUnpaid,
  updateOrderNotes,
} from "../actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<
  "unpaid" | "paid" | "cancelled",
  "vermillion" | "jade" | "muted"
> = {
  unpaid: "vermillion",
  paid: "jade",
  cancelled: "muted",
};

type OrderRow = {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  member_id: string | null;
  subtotal_cents: number;
  service_fee_cents: number;
  total_cents: number;
  order_date: string;
  payment_method: string;
  payment_status: "unpaid" | "paid" | "cancelled";
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    sku: string;
    name: string;
    unit_cents: number;
    quantity: number;
    line_cents: number;
    display_order: number;
  }[];
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id,customer_first_name,customer_last_name,customer_email,member_id,subtotal_cents,service_fee_cents,total_cents,order_date,payment_method,payment_status,paid_at,notes,created_at,order_items(id,sku,name,unit_cents,quantity,line_cents,display_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as OrderRow;
  const items = (order.order_items ?? []).slice().sort(
    (a, b) => a.display_order - b.display_order,
  );

  return (
    <>
      <PageHeader
        title={`Order — ${order.customer_first_name} ${order.customer_last_name}`}
        description={`Submitted ${formatDate(order.created_at.slice(0, 10))}`}
        action={
          <Link
            href="/admin/orders"
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-accent/10 hover:border-accent"
          >
            ← All orders
          </Link>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="md:col-span-2 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-medium text-base">Items</h2>
            <Badge tone={STATUS_TONE[order.payment_status]}>
              {order.payment_status}
            </Badge>
          </div>
          <ul className="mt-4 divide-y divide-foreground/8">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-baseline justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{it.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SKU {it.sku} · {formatUsd(it.unit_cents)} × {it.quantity}
                  </p>
                </div>
                <span className="font-mono tabular-nums text-sm">
                  {formatUsd(it.line_cents)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 text-sm border-t border-foreground/10 pt-4">
            <div className="flex items-baseline justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="font-mono tabular-nums">
                {formatUsd(order.subtotal_cents)}
              </dd>
            </div>
            {order.service_fee_cents > 0 && (
              <div className="flex items-baseline justify-between text-muted-foreground">
                <dt>Service fee</dt>
                <dd className="font-mono tabular-nums">
                  {formatUsd(order.service_fee_cents)}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between font-medium text-base pt-1">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums text-vermillion">
                {formatUsd(order.total_cents)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="font-medium text-base">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Detail label="Name">
              {order.customer_first_name} {order.customer_last_name}
            </Detail>
            <Detail label="Email">
              <a
                href={`mailto:${order.customer_email}`}
                className="hover:text-vermillion"
              >
                {order.customer_email}
              </a>
            </Detail>
            <Detail label="Method">
              {order.payment_method.replace("_", " ")}
            </Detail>
            <Detail label="Order date">
              {formatDate(order.order_date)}
            </Detail>
            {order.paid_at && (
              <Detail label="Paid at">
                {formatDate(order.paid_at.slice(0, 10))}
              </Detail>
            )}
            {order.member_id && (
              <Detail label="Member">
                <Link
                  href={`/admin/members/${order.member_id}`}
                  className="hover:text-vermillion"
                >
                  View record →
                </Link>
              </Detail>
            )}
          </dl>
        </Card>

        <Card className="md:col-span-2 p-6">
          <h2 className="font-medium text-base">Internal notes</h2>
          <form action={updateOrderNotes} className="mt-3 grid gap-3">
            <input type="hidden" name="id" value={order.id} />
            <Textarea
              name="notes"
              rows={4}
              defaultValue={order.notes ?? ""}
              placeholder="Pickup arranged, follow-up reminders, anything you'd want to remember next time you open this order."
            />
            <Button type="submit" size="sm" className="self-start">
              Save notes
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-medium text-base">Actions</h2>
          <div className="mt-3 flex flex-col gap-2">
            {order.payment_status !== "paid" ? (
              <form action={markOrderPaid}>
                <input type="hidden" name="id" value={order.id} />
                <Button type="submit" className="w-full">
                  Mark paid
                </Button>
              </form>
            ) : (
              <form action={markOrderUnpaid}>
                <input type="hidden" name="id" value={order.id} />
                <Button type="submit" variant="outline" className="w-full">
                  Reset to unpaid
                </Button>
              </form>
            )}
            {order.payment_status !== "cancelled" && (
              <form action={cancelOrder}>
                <input type="hidden" name="id" value={order.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full"
                >
                  Cancel order
                </Button>
              </form>
            )}
            <form action={deleteOrder}>
              <input type="hidden" name="id" value={order.id} />
              <Button
                type="submit"
                variant="ghost"
                className="w-full text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
