"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PAYMENT_METHODS,
  SERVICE_FEE_CENTS,
  isPaymentMethod,
  methodHasServiceFee,
} from "@/lib/store/catalog";
import { composeLineItemName, fetchVariantsBySkus } from "@/lib/store/db";

export type OrderState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string | string[]>;
    }
  | { status: "success"; orderId: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function snapshot(formData: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    if (all.length === 0) continue;
    out[key] = all.length === 1 ? all[0] : all;
  }
  return out;
}

export async function submitOrder(
  _prev: OrderState,
  formData: FormData,
): Promise<OrderState> {
  // Honeypot — real users leave it empty.
  if ((formData.get("website") as string)?.trim()) {
    redirect(`/store/order/thanks`);
  }

  const first_name = ((formData.get("first_name") as string) ?? "").trim();
  const last_name = ((formData.get("last_name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim();
  const payment_method = ((formData.get("payment_method") as string) ?? "").trim();

  // Quantities posted as q_<sku>=<n>. SKU validation happens against
  // the live store_variants table — prices are fetched fresh so we
  // never honour a stale price the client might have cached and so
  // unknown SKUs are silently dropped.
  const requested: { sku: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("q_") || typeof value !== "string") continue;
    const sku = key.slice(2);
    const qty = parseInt(value, 10);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    requested.push({ sku, quantity: Math.min(qty, 99) });
  }

  const resolved = await fetchVariantsBySkus(requested.map((r) => r.sku));
  const items = requested.filter((r) => resolved.has(r.sku));

  const fieldErrors: Record<string, string> = {};
  if (!first_name) fieldErrors.first_name = "Required.";
  else if (first_name.length > 100) fieldErrors.first_name = "Too long.";
  if (!last_name) fieldErrors.last_name = "Required.";
  else if (last_name.length > 100) fieldErrors.last_name = "Too long.";
  if (!email) fieldErrors.email = "Required.";
  else if (!EMAIL_RE.test(email) || email.length > 200)
    fieldErrors.email = "Please enter a valid email.";
  if (!isPaymentMethod(payment_method))
    fieldErrors.payment_method = "Please choose a payment method.";
  if (items.length === 0)
    fieldErrors.order_items = "Please pick at least one item.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      values: snapshot(formData),
    };
  }

  const method = payment_method as (typeof PAYMENT_METHODS)[number]["value"];
  const lines = items.map((it) => {
    const variant = resolved.get(it.sku)!;
    return {
      sku: variant.sku,
      name: composeLineItemName(variant),
      unit_cents: variant.price_cents,
      quantity: it.quantity,
      line_cents: variant.price_cents * it.quantity,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.line_cents, 0);
  const service_fee = methodHasServiceFee(method) ? SERVICE_FEE_CENTS : 0;
  const total = subtotal + service_fee;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent") ?? null;

  const supabase = createAdminClient();

  // Try to link to an existing member by email — best-effort, no failure.
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_first_name: first_name,
      customer_last_name: last_name,
      customer_email: email,
      member_id: member?.id ?? null,
      subtotal_cents: subtotal,
      service_fee_cents: service_fee,
      total_cents: total,
      payment_method: method,
      payment_status: "unpaid" as const,
      ip,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return {
      status: "error",
      message:
        "We couldn't save your order. Please try again or email info@woodlandstaichi.com.",
      values: snapshot(formData),
    };
  }

  const { error: itemsErr } = await supabase.from("order_items").insert(
    lines.map((l, i) => ({
      order_id: order.id,
      sku: l.sku,
      name: l.name,
      unit_cents: l.unit_cents,
      quantity: l.quantity,
      line_cents: l.line_cents,
      display_order: i,
    })),
  );

  if (itemsErr) {
    // Best effort: roll the order back so we don't end up with an empty order.
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      status: "error",
      message:
        "We couldn't save your order items. Please try again or email info@woodlandstaichi.com.",
      values: snapshot(formData),
    };
  }

  redirect(`/store/order/thanks?id=${order.id}`);
}
