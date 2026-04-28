"use server";

import { createHmac } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import { issueQrToken } from "@/lib/qr/token";
import { qrLabeledPngBuffer } from "@/lib/qr/image";
import { sendEmail } from "@/lib/email/send";
import {
  qrEmailHtml,
  qrEmailText,
  QR_EMAIL_CID,
} from "@/lib/email/qr-template";
import { revalidatePath } from "next/cache";

export type EmailQrResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/** Send the member their QR by email. If they don't have one yet,
 * issue one first so the email always succeeds when called. */
export async function emailQrToMember(
  memberId: string,
): Promise<EmailQrResult> {
  await requireStaff();
  if (!memberId) return { ok: false, message: "Missing member id." };

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("members")
    .select("id,first_name,last_name,email,qr_token")
    .eq("id", memberId)
    .maybeSingle();

  if (error || !member) {
    return { ok: false, message: "Member not found." };
  }
  if (!member.email) {
    return {
      ok: false,
      message: `${member.first_name} ${member.last_name} has no email on file.`,
    };
  }

  // Make sure a token exists. Issue one if missing.
  let tokenId = member.qr_token as string | null;
  if (!tokenId) {
    const issued = issueQrToken();
    tokenId = issued.tokenId;
    const { error: updateErr } = await supabase
      .from("members")
      .update({
        qr_token: tokenId,
        qr_issued_at: new Date().toISOString(),
        qr_revoked_at: null,
      })
      .eq("id", memberId);
    if (updateErr) {
      return { ok: false, message: updateErr.message };
    }
  }

  // Re-derive the encoded form from the persisted tokenId.
  const sig = createHmac("sha256", process.env.QR_TOKEN_SECRET ?? "")
    .update(tokenId)
    .digest("base64url");
  const encoded = `${tokenId}.${sig}`;

  // Composite: QR + "Woodlands Tai Chi" + member name into a single PNG so
  // that whatever the member saves (Photos / Wallet / printed) carries
  // the readable label the instructor can verify at a glance during scan.
  const memberName = `${member.first_name} ${member.last_name}`;
  const pngBuffer = await qrLabeledPngBuffer(encoded, memberName);

  // Send the PNG as an inline attachment and reference it via cid:
  // in the HTML. Gmail (and Outlook) strip long data: URLs, so a
  // proper Content-ID is the only reliable way to render inline.
  const result = await sendEmail({
    to: member.email,
    subject: "Your Woodlands Tai Chi attendance QR",
    html: qrEmailHtml({ firstName: member.first_name }),
    text: qrEmailText(member.first_name),
    attachments: [
      {
        filename: `wtc-qr-${member.last_name}-${member.first_name}.png`,
        content: pngBuffer,
        contentId: QR_EMAIL_CID,
      },
    ],
  });

  if (!result.ok) return result;

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath(`/admin/members/${memberId}/qr`);

  return {
    ok: true,
    message: `Sent to ${member.email}.`,
  };
}
