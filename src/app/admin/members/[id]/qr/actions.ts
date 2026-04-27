"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import { issueQrToken } from "@/lib/qr/token";

/** Issue a fresh QR for the member (or rotate an existing one). The PNG
 * is re-derived from the persisted tokenId on render, so this action just
 * mutates the row and lets revalidatePath drive the UI update. */
export async function issueQrForMember(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { tokenId } = issueQrToken();

  const supabase = await createClient();
  await supabase
    .from("members")
    .update({
      qr_token: tokenId,
      qr_issued_at: new Date().toISOString(),
      qr_revoked_at: null,
    })
    .eq("id", id);

  revalidatePath(`/admin/members/${id}`);
  revalidatePath(`/admin/members/${id}/qr`);
}

export async function revokeQr(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("members")
    .update({
      qr_token: null,
      qr_revoked_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/members/${id}`);
  revalidatePath(`/admin/members/${id}/qr`);
}
