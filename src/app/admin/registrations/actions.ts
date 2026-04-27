"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";

type PaymentStatus = "pending" | "paid" | "waived" | "refunded";

async function setRegistrationPayment(
  id: string,
  status: PaymentStatus,
  opts: { activateMember?: boolean } = {},
) {
  await requireStaff();
  if (!id) return;
  const supabase = await createClient();

  const patch: Record<string, unknown> = { payment_status: status };
  if (status === "paid" || status === "waived") {
    patch.payment_received_at = new Date().toISOString();
  } else {
    patch.payment_received_at = null;
  }

  const { data: row, error } = await supabase
    .from("registrations")
    .update(patch)
    .eq("id", id)
    .select("member_id")
    .maybeSingle();

  if (error || !row) return;

  // When marking paid/waived, flip the member from waitlist → active.
  if (opts.activateMember && (status === "paid" || status === "waived")) {
    await supabase
      .from("members")
      .update({ status: "active" })
      .eq("id", row.member_id)
      .eq("status", "waitlist");
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${row.member_id}`);
}

export async function markPaid(formData: FormData) {
  return setRegistrationPayment(String(formData.get("id") ?? ""), "paid", {
    activateMember: true,
  });
}
export async function markWaived(formData: FormData) {
  return setRegistrationPayment(String(formData.get("id") ?? ""), "waived", {
    activateMember: true,
  });
}
export async function markPending(formData: FormData) {
  return setRegistrationPayment(String(formData.get("id") ?? ""), "pending");
}
export async function markRefunded(formData: FormData) {
  return setRegistrationPayment(String(formData.get("id") ?? ""), "refunded");
}
