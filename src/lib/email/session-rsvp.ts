import "server-only";

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

type SessionMeta = {
  className: string;
  location: string | null;
  dateLabel: string;   // already formatted, e.g. "Tuesday, May 5"
  timeLabel: string;   // already formatted, e.g. "7:00 AM – 8:00 AM"
};

/** Roster email sent to all newly-approved members for a session.
 *  To: school inbox (so a reply is monitored).
 *  Bcc: every approved member (privacy — they don't see each other's
 *  email addresses, just a participant list rendered in the body). */
export function sessionApprovalRoster(opts: {
  session: SessionMeta;
  participantNames: string[];
  recipientEmails: string[];
}) {
  const list = opts.participantNames
    .map(
      (n) =>
        `<li style="margin:4px 0; padding-left:0; color:#1c1815;">${escapeHtml(n)}</li>`,
    )
    .join("");

  const locationLine = opts.session.location
    ? `<p style="margin:0 0 4px;"><strong>Where:</strong> ${escapeHtml(opts.session.location)}</p>`
    : "";

  return {
    to: ADMIN_INBOX,
    bcc: opts.recipientEmails,
    subject: `You're in — ${opts.session.className} on ${opts.session.dateLabel}`,
    html: wrap(
      "You're in.",
      `
      <p style="font-size:16px;">Hi there,</p>
      <p style="font-size:16px;">Your request to attend a class with ${SCHOOL} has been approved. We&rsquo;ll see you there.</p>
      <div style="margin:20px 0; padding:16px 18px; background:#f6f2ec; border-radius:10px; font-size:15px;">
        <p style="margin:0 0 4px;"><strong>Class:</strong> ${escapeHtml(opts.session.className)}</p>
        <p style="margin:0 0 4px;"><strong>When:</strong> ${escapeHtml(opts.session.dateLabel)} · ${escapeHtml(opts.session.timeLabel)}</p>
        ${locationLine}
      </div>
      <p style="font-size:16px;">Approved attendees:</p>
      <ul style="font-size:15px; padding-left:20px; margin:8px 0 16px;">${list}</ul>
      <p style="font-size:14px; color:#7a716a;">Need to cancel? Reply to this email or update your status under <em>My profile</em> on woodlandstaichi.com.</p>
      `,
    ),
    text: `Your request to attend ${opts.session.className} on ${opts.session.dateLabel} (${opts.session.timeLabel}) has been approved.${
      opts.session.location ? `\nWhere: ${opts.session.location}` : ""
    }\n\nApproved attendees:\n${opts.participantNames.map((n) => `  - ${n}`).join("\n")}\n\nNeed to cancel? Reply or update your status at ${SITE_URL}/members/me.`,
  };
}

/** Roster email sent to members whose request was declined for a session. */
export function sessionRejectionRoster(opts: {
  session: SessionMeta;
  recipientEmails: string[];
}) {
  return {
    to: ADMIN_INBOX,
    bcc: opts.recipientEmails,
    subject: `About your request — ${opts.session.className} on ${opts.session.dateLabel}`,
    html: wrap(
      "A note from the school.",
      `
      <p style="font-size:16px;">Hi there,</p>
      <p style="font-size:16px;">Thanks for asking to join us for <strong>${escapeHtml(opts.session.className)}</strong> on ${escapeHtml(opts.session.dateLabel)}. We weren&rsquo;t able to approve every request this time — the room or the level fit didn&rsquo;t line up for this date.</p>
      <p style="font-size:16px;">Please feel free to request another upcoming session, or reply to this email if you&rsquo;d like to talk it through.</p>
      <p style="font-size:14px; color:#7a716a;">— ${SCHOOL}</p>
      `,
    ),
    text: `Thanks for requesting ${opts.session.className} on ${opts.session.dateLabel}. We weren't able to approve every request this time. Please request another upcoming session at ${SITE_URL}/members/me, or reply if you'd like to talk it through.`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
