import "server-only";

// Plain inline-HTML templates. Email clients are unforgiving with CSS,
// so we keep markup simple and inline-style anything important. Tone
// matches the rest of the site (editorial-quiet, not transactional-cold).

const SCHOOL = "Woodlands Tai Chi";
const ADMIN_INBOX =
  process.env.WTC_ADMIN_INBOX || "info@woodlandstaichi.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://woodlandstaichi.com";

const wrap = (heading: string, body: string) => `
<!doctype html>
<html><body style="font-family: Georgia, 'Times New Roman', serif; color:#1c1815; line-height:1.6; max-width:560px; margin:0 auto; padding:32px 24px;">
  <h1 style="font-family: Georgia, serif; font-size:28px; font-weight:500; letter-spacing:-0.01em; margin:0 0 16px; color:#1c1815;">
    ${heading}
  </h1>
  ${body}
  <hr style="border:0; border-top:1px solid #e8e2dc; margin:28px 0;" />
  <p style="font-size:13px; color:#7a716a; margin:0;">
    ${SCHOOL} — <a href="${SITE_URL}" style="color:#c84134; text-decoration:none;">woodlandstaichi.com</a>
  </p>
</body></html>`;

export function adminReactivationNotice(opts: {
  memberName: string;
  memberEmail: string;
  requestId: string;
}) {
  const reviewUrl = `${SITE_URL}/admin/reactivations`;
  return {
    to: ADMIN_INBOX,
    subject: `Reactivation request — ${opts.memberName}`,
    html: wrap(
      "A returning player wants back in.",
      `
      <p style="font-size:16px;"><strong>${opts.memberName}</strong> (${opts.memberEmail}) has asked to be reactivated.</p>
      <p style="font-size:16px;">Open the queue to approve or decline:</p>
      <p>
        <a href="${reviewUrl}" style="display:inline-block; background:#1c1815; color:#fffaf3; padding:12px 24px; text-decoration:none; border-radius:999px; font-weight:500;">
          Review queue →
        </a>
      </p>
      <p style="font-size:13px; color:#7a716a; margin-top:24px;">Request id: ${opts.requestId}</p>
      `,
    ),
    text: `${opts.memberName} (${opts.memberEmail}) has requested reactivation.\n\nReview: ${reviewUrl}\n\nRequest id: ${opts.requestId}`,
  };
}

export function memberRequestAck(opts: {
  memberName: string;
  memberEmail: string;
}) {
  return {
    to: opts.memberEmail,
    subject: "We got your request",
    html: wrap(
      "Welcome back — almost.",
      `
      <p style="font-size:16px;">Hi ${opts.memberName},</p>
      <p style="font-size:16px;">We received your request to come back to ${SCHOOL}. Sifu will review it shortly and we&rsquo;ll email you the moment a decision is made.</p>
      <p style="font-size:16px;">No further action needed for now. If anything has changed about your contact info or health, reply to this email and let us know.</p>
      `,
    ),
    text: `Hi ${opts.memberName},\n\nWe received your request to return to ${SCHOOL}. Sifu will review it shortly and we'll email you when a decision is made.\n\nReply to this email if anything has changed.`,
  };
}

export function memberApproved(opts: {
  memberName: string;
  memberEmail: string;
}) {
  return {
    to: opts.memberEmail,
    subject: "You're back on the roster",
    html: wrap(
      "Welcome back.",
      `
      <p style="font-size:16px;">Hi ${opts.memberName},</p>
      <p style="font-size:16px;">Your request was approved. You&rsquo;re marked active again — come to any class on the schedule and we&rsquo;ll be glad to see you.</p>
      <p>
        <a href="${SITE_URL}/classes" style="display:inline-block; background:#c84134; color:#fffaf3; padding:12px 24px; text-decoration:none; border-radius:999px; font-weight:500;">
          See the schedule →
        </a>
      </p>
      `,
    ),
    text: `Hi ${opts.memberName},\n\nYour reactivation request was approved. You're marked active again — come to any class on the schedule.\n\n${SITE_URL}/classes`,
  };
}

export function memberRejected(opts: {
  memberName: string;
  memberEmail: string;
  note: string | null;
}) {
  const noteHtml = opts.note
    ? `<p style="font-size:16px; padding:14px 16px; background:#f6f2ec; border-radius:8px; margin:16px 0;"><em>From the founder:</em><br />${opts.note.replace(/\n/g, "<br />")}</p>`
    : "";
  const noteText = opts.note ? `\n\nFrom the founder:\n${opts.note}\n` : "";
  return {
    to: opts.memberEmail,
    subject: "About your return",
    html: wrap(
      "A note from the school.",
      `
      <p style="font-size:16px;">Hi ${opts.memberName},</p>
      <p style="font-size:16px;">Thanks for reaching out. We&rsquo;re not able to reactivate your membership through the form right now.</p>
      ${noteHtml}
      <p style="font-size:16px;">If you&rsquo;d like to talk this through, please reply to this email or write to ${ADMIN_INBOX}.</p>
      `,
    ),
    text: `Hi ${opts.memberName},\n\nThanks for reaching out. We're not able to reactivate your membership through the form right now.${noteText}\n\nReply or write to ${ADMIN_INBOX} to talk it through.`,
  };
}
