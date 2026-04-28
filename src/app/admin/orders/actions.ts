"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function setStatus(
  id: string,
  status: "unpaid" | "paid" | "cancelled",
) {
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({
      payment_status: status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function markOrderPaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setStatus(id, "paid");
}

export async function markOrderUnpaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setStatus(id, "unpaid");
}

export async function cancelOrder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setStatus(id, "cancelled");
}

export async function deleteOrder(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("orders").delete().eq("id", id);
  revalidatePath("/admin/orders");
}

export async function updateOrderNotes(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ notes: notes || null })
    .eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}
