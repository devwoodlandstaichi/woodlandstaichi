"use server";

import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
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

// Each QR send is roughly 400–700ms (PNG composite + Resend API). The
// per-invocation cap gates how many we attempt in a single round-trip
// to stay safely under the Vercel function timeout (configured at the
// /admin/members page level via export const maxDuration). Admin clicks
// the button again to send subsequent batches.
const PER_INVOCATION_CAP = 50;

export type BulkEmailQrResult = {
  /** Emails actually sent (Resend acknowledged). */
  sent: number;
  /** Members in scope that we didn't email this round (no email,
   * already-emailed when we were honoring "skip already sent", etc.). */
  skipped: number;
  /** Failures (Resend or DB error). */
  failed: number;
  /** True if scope was larger than the per-invocation cap and there
   * are members left to email. */
  more: boolean;
  /** Total members initially in scope. */
  scope: number;
  message: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  qr_token: string | null;
};

/** The actual per-member send. Returns true if Resend accepted; false
 * otherwise. Always stamps qr_emailed_at on success. Mints a token if
 * the member doesn't have one yet. */
async function sendOne(
  supabase: Awaited<ReturnType<typeof createClient>>,
  member: Member,
): Promise<boolean> {
  if (!member.email) return false;

  let tokenId = member.qr_token;
  if (!tokenId) {
    const issued = issueQrToken();
    tokenId = issued.tokenId;
    const { error } = await supabase
      .from("members")
      .update({
        qr_token: tokenId,
        qr_issued_at: new Date().toISOString(),
        qr_revoked_at: null,
      })
      .eq("id", member.id);
    if (error) return false;
  }

  const sig = createHmac("sha256", process.env.QR_TOKEN_SECRET ?? "")
    .update(tokenId)
    .digest("base64url");
  const encoded = `${tokenId}.${sig}`;

  const memberName = `${member.first_name} ${member.last_name}`;
  const png = await qrLabeledPngBuffer(encoded, memberName);

  const result = await sendEmail({
    to: member.email,
    subject: "Your Woodlands Tai Chi attendance QR",
    html: qrEmailHtml({ firstName: member.first_name }),
    text: qrEmailText(member.first_name),
    attachments: [
      {
        filename: `wtc-qr-${member.last_name}-${member.first_name}.png`,
        content: png,
        contentId: QR_EMAIL_CID,
      },
    ],
  });

  if (!result.ok) return false;

  await supabase
    .from("members")
    .update({ qr_emailed_at: new Date().toISOString() })
    .eq("id", member.id);

  return true;
}

/** Email QR to a specific list of member ids (selection-aware). Skips
 * members without an email on file. Does NOT skip already-emailed
 * members — selection is an explicit ask. */
export async function bulkEmailQrToIds(
  ids: string[],
): Promise<BulkEmailQrResult> {
  await requireStaff();
  if (!ids || ids.length === 0) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      more: false,
      scope: 0,
      message: "Select members first.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("id,first_name,last_name,email,qr_token")
    .in("id", ids);
  if (error) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      more: false,
      scope: 0,
      message: error.message,
    };
  }

  const members = (data ?? []) as Member[];
  const scope = members.length;
  const batch = members.slice(0, PER_INVOCATION_CAP);
  const more = members.length > PER_INVOCATION_CAP;

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const m of batch) {
    if (!m.email) {
      skipped++;
      continue;
    }
    const ok = await sendOne(supabase, m);
    if (ok) sent++;
    else failed++;
  }

  revalidatePath("/admin/members");

  return {
    sent,
    skipped,
    failed,
    more,
    scope,
    message: summarize({ sent, skipped, failed, more, scope }),
  };
}

/** Email QR to every member who has a qr_token but has never been
 * emailed (qr_emailed_at IS NULL). Caps at PER_INVOCATION_CAP per
 * call; admin clicks again to send the next batch. */
export async function bulkEmailQrUnsent(): Promise<BulkEmailQrResult> {
  await requireStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id,first_name,last_name,email,qr_token")
    .not("qr_token", "is", null)
    .is("qr_emailed_at", null)
    .neq("status", "inactive")
    .not("email", "is", null)
    .order("created_at", { ascending: true });
  if (error) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      more: false,
      scope: 0,
      message: error.message,
    };
  }

  const members = (data ?? []) as Member[];
  const scope = members.length;
  const batch = members.slice(0, PER_INVOCATION_CAP);
  const more = members.length > PER_INVOCATION_CAP;

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const m of batch) {
    if (!m.email) {
      skipped++;
      continue;
    }
    const ok = await sendOne(supabase, m);
    if (ok) sent++;
    else failed++;
  }

  revalidatePath("/admin/members");

  return {
    sent,
    skipped,
    failed,
    more,
    scope,
    message: summarize({ sent, skipped, failed, more, scope }),
  };
}

function summarize(r: {
  sent: number;
  skipped: number;
  failed: number;
  more: boolean;
  scope: number;
}): string {
  if (r.scope === 0) return "Nobody to email — every active member with a QR has already received theirs.";
  const parts = [`Sent ${r.sent} QR${r.sent === 1 ? "" : "s"}`];
  if (r.skipped > 0) parts.push(`${r.skipped} skipped (no email)`);
  if (r.failed > 0) parts.push(`${r.failed} failed`);
  if (r.more) parts.push(`${r.scope - r.sent - r.skipped - r.failed} still queued — click again`);
  return parts.join(" · ") + ".";
}
