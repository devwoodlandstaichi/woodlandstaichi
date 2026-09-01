"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";
import { sendEmail } from "@/lib/email/send";
import {
  memberRegistrationApproved,
  memberRegistrationDenied,
} from "@/lib/email/registration";
import { issueQrToken } from "@/lib/qr/token";
import { dayLabel, formatTimeRange } from "@/lib/format";

type PaymentStatus = "pending" | "paid" | "waived" | "refunded";

type ApprovalCtx = {
  memberId: string;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberEmail: string | null;
  className: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  /** True if the member is being flipped from waitlist → active by this
   * action (the moment we send the approval email + ensure a QR). */
  activatedNow: boolean;
};

/** Mint a QR token for a member if they don't already have one. Returns
 * true when a fresh token was issued (so callers can tell the user). */
async function ensureQrToken(memberId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("members")
    .select("qr_token")
    .eq("id", memberId)
    .maybeSingle();
  if (!row || row.qr_token) return false;
  const { tokenId } = issueQrToken();
  await admin
    .from("members")
    .update({ qr_token: tokenId, qr_issued_at: new Date().toISOString() })
    .eq("id", memberId);
  return true;
}

function classLabel(c: ApprovalCtx): string {
  const parts: string[] = [];
  if (c.className) parts.push(c.className);
  if (c.dayOfWeek) parts.push(dayLabel(c.dayOfWeek));
  if (c.startTime && c.endTime) {
    parts.push(formatTimeRange(c.startTime, c.endTime));
  }
  return parts.join(" · ") || "your class";
}

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
    .select(
      "member_id,members:members(id,first_name,last_name,email,status),classes:classes(name,day_of_week,start_time,end_time)",
    )
    .maybeSingle();

  if (error || !row) return;

  // Treat this as the moment of activation only when admin marks
  // paid/waived AND the member was previously on the waitlist. Avoid
  // re-emailing if the member is already active (e.g. admin clicked
  // paid twice, or fixed a typo on payment_method).
  const memberRow = (
    Array.isArray(row.members) ? row.members[0] : row.members
  ) as ApprovalCtx["memberId"] extends string
    ? {
        id: string;
        first_name: string;
        last_name: string;
        email: string | null;
        status: string;
      } | null
    : never;
  const classRow = (
    Array.isArray(row.classes) ? row.classes[0] : row.classes
  ) as {
    name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  } | null;

  let activatedNow = false;
  if (
    opts.activateMember &&
    (status === "paid" || status === "waived") &&
    memberRow?.status === "waitlist"
  ) {
    const { error: updErr } = await supabase
      .from("members")
      .update({ status: "active" })
      .eq("id", row.member_id)
      .eq("status", "waitlist");
    if (!updErr) activatedNow = true;
  }

  if (activatedNow && memberRow?.email) {
    const qrIssued = await ensureQrToken(row.member_id);
    const ctx: ApprovalCtx = {
      memberId: row.member_id,
      memberFirstName: memberRow.first_name,
      memberLastName: memberRow.last_name,
      memberEmail: memberRow.email,
      className: classRow?.name ?? null,
      dayOfWeek: classRow?.day_of_week ?? null,
      startTime: classRow?.start_time ?? null,
      endTime: classRow?.end_time ?? null,
      activatedNow: true,
    };
    const msg = memberRegistrationApproved({
      memberName: ctx.memberFirstName ?? "there",
      memberEmail: memberRow.email,
      classLabel: classLabel(ctx),
      qrIssued,
    });
    // Best-effort — don't block the action if SMTP hiccups.
    await sendEmail(msg).catch(() => {});
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

/** Demote an already-active member back to the waitlist — covers the
 * "we marked paid by mistake" / chargeback case. No email; this is an
 * internal correction, the member doesn't need to be told their status
 * was briefly wrong. */
export async function markDemoted(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("registrations")
    .select("member_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;

  await supabase
    .from("members")
    .update({ status: "waitlist" })
    .eq("id", row.member_id)
    .eq("status", "active");

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${row.member_id}`);
}

/** Explicitly deny a registration. Records denied_at + an optional
 * reason on the registration row, leaves the member on waitlist, and
 * notifies the registrant. We never auto-delete on deny so the audit
 * trail stays. */
export async function markDenied(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!id) return;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("registrations")
    .update({
      denied_at: new Date().toISOString(),
      denial_reason: reason,
    })
    .eq("id", id)
    .select(
      "member_id,members:members(first_name,last_name,email),classes:classes(name,day_of_week,start_time,end_time)",
    )
    .maybeSingle();
  if (error || !row) return;

  const memberRow = (
    Array.isArray(row.members) ? row.members[0] : row.members
  ) as { first_name: string; last_name: string; email: string | null } | null;
  const classRow = (
    Array.isArray(row.classes) ? row.classes[0] : row.classes
  ) as {
    name: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  } | null;

  if (memberRow?.email) {
    const ctx: ApprovalCtx = {
      memberId: row.member_id,
      memberFirstName: memberRow.first_name,
      memberLastName: memberRow.last_name,
      memberEmail: memberRow.email,
      className: classRow?.name ?? null,
      dayOfWeek: classRow?.day_of_week ?? null,
      startTime: classRow?.start_time ?? null,
      endTime: classRow?.end_time ?? null,
      activatedNow: false,
    };
    const msg = memberRegistrationDenied({
      memberName: memberRow.first_name ?? "there",
      memberEmail: memberRow.email,
      classLabel: classLabel(ctx),
      reason,
    });
    await sendEmail(msg).catch(() => {});
  }

  revalidatePath("/admin/registrations");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${row.member_id}`);
}

/** Hard-delete a registration row. Admin-only. Use for genuine garbage
 * (test rows, spam, exact duplicates) — use Deny for legitimate rejections
 * so the audit trail stays. */
export async function deleteRegistration(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("registrations").delete().eq("id", id);
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/members");
}

/** Clear an existing denial — admin changed their mind / mis-clicked.
 * No email (we already sent the denial; no need to confuse the member
 * unless and until we approve them, at which point markPaid covers it). */
export async function markUndenied(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("registrations")
    .update({ denied_at: null, denial_reason: null })
    .eq("id", id);
  revalidatePath("/admin/registrations");
}
