"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import { issueQrToken } from "@/lib/qr/token";

export type BulkIssueResult = {
  issued: number;
  scanned: number;
  message: string;
};

/** Issue a QR for every active or waitlist member that doesn't already
 * have one. Existing tokens are left alone — this is intentionally a
 * non-destructive bulk action. To rotate a member's existing QR, use
 * the per-member Regenerate button instead.
 *
 * For ~75 members this loops in <500ms. If we ever scale past a few
 * hundred members, swap to a single CASE-WHEN bulk UPDATE.
 */
export async function issueMissingQrs(): Promise<BulkIssueResult> {
  await requireStaff();
  const supabase = await createClient();

  const { data: rows, error: selectError } = await supabase
    .from("members")
    .select("id")
    .is("qr_token", null)
    .neq("status", "inactive");

  if (selectError) {
    return { issued: 0, scanned: 0, message: selectError.message };
  }

  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length === 0) {
    return {
      issued: 0,
      scanned: 0,
      message: "Every active member already has a QR.",
    };
  }

  const now = new Date().toISOString();
  let issued = 0;

  for (const id of ids) {
    const { tokenId } = issueQrToken();
    const { error } = await supabase
      .from("members")
      .update({
        qr_token: tokenId,
        qr_issued_at: now,
        qr_revoked_at: null,
      })
      .eq("id", id);
    if (!error) issued++;
  }

  revalidatePath("/admin/members");

  return {
    issued,
    scanned: ids.length,
    message:
      issued === ids.length
        ? `Issued ${issued} new QR${issued === 1 ? "" : "s"}.`
        : `Issued ${issued} of ${ids.length} — ${ids.length - issued} failed.`,
  };
}
