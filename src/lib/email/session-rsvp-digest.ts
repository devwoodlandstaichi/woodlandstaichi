import "server-only";

const SCHOOL = "Woodlands Tai Chi";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://woodlandstaichi.com";

const wrap = (heading: string, body: string) => `
<!doctype html>
<html><body style="font-family: Georgia, 'Times New Roman', serif; color:#1c1815; line-height:1.6; max-width:560px; margin:0 auto; padding:32px 24px;">
  <h1 style="font-family: Georgia, serif; font-size:24px; font-weight:500; letter-spacing:-0.01em; margin:0 0 12px; color:#1c1815;">
    ${heading}
  </h1>
  ${body}
  <hr style="border:0; border-top:1px solid #e8e2dc; margin:24px 0;" />
  <p style="font-size:12px; color:#7a716a; margin:0;">
    ${SCHOOL} — <a href="${SITE_URL}" style="color:#c84134; text-decoration:none;">woodlandstaichi.com</a>
  </p>
</body></html>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type DigestSession = {
  sessionId: string;
  className: string;
  dayLabel: string;       // "Tuesday, May 5"
  timeLabel: string;      // "7:00 AM – 8:00 AM"
  location: string | null;
  pendingCount: number;
  pendingNames: string[]; // up to ~12 names; truncate the rest
};

/** Per-recipient digest. `recipientLabel` is e.g. "for Wednesday Tai Chi"
 *  for an instructor scoped to one class, or "" for the school-wide
 *  admin digest. */
export function sessionRsvpDigest(opts: {
  to: string;
  recipientLabel: string;
  sessions: DigestSession[];
  totalPending: number;
}) {
  if (opts.sessions.length === 0) {
    throw new Error("digest must include at least one session");
  }

  const sessionsHtml = opts.sessions
    .map((s) => {
      const NAME_LIMIT = 12;
      const shown = s.pendingNames.slice(0, NAME_LIMIT);
      const rest = s.pendingCount - shown.length;
      const nameList = shown.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      const tail = rest > 0
        ? `<li style="color:#7a716a; font-style:italic;">…and ${rest} more</li>`
        : "";
      const reviewUrl = `${SITE_URL}/admin/sessions/${s.sessionId}`;
      const locationLine = s.location
        ? ` · ${escapeHtml(s.location)}`
        : "";
      return `
      <div style="margin:20px 0; padding:16px 18px; background:#f6f2ec; border-radius:10px;">
        <p style="margin:0 0 4px; font-size:15px;">
          <strong>${escapeHtml(s.className)}</strong>
        </p>
        <p style="margin:0 0 10px; font-size:13px; color:#7a716a;">
          ${escapeHtml(s.dayLabel)} · ${escapeHtml(s.timeLabel)}${locationLine}
        </p>
        <p style="margin:0 0 8px; font-size:14px;">
          <strong>${s.pendingCount}</strong> awaiting review:
        </p>
        <ul style="margin:0 0 12px; padding-left:20px; font-size:14px;">
          ${nameList}${tail}
        </ul>
        <a href="${reviewUrl}" style="display:inline-block; background:#1c1815; color:#fffaf3; padding:8px 16px; text-decoration:none; border-radius:999px; font-size:13px; font-weight:500;">
          Open session →
        </a>
      </div>`;
    })
    .join("");

  const labelLine = opts.recipientLabel
    ? `<p style="margin:0 0 12px; font-size:14px; color:#7a716a;">${escapeHtml(opts.recipientLabel)}</p>`
    : "";

  return {
    to: opts.to,
    subject: `${opts.totalPending} RSVP${opts.totalPending === 1 ? "" : "s"} awaiting review`,
    html: wrap(
      "Today's RSVP queue.",
      `
      ${labelLine}
      <p style="font-size:15px;">${opts.totalPending} member${opts.totalPending === 1 ? " is" : "s are"} waiting on a decision before class. Quick pass below — open each session to approve, reject, or waitlist.</p>
      ${sessionsHtml}
      <p style="margin-top:20px; font-size:13px; color:#7a716a;">Sent once a day at end of day. We never email when the queue is empty.</p>
      `,
    ),
    text: `${opts.totalPending} RSVP${opts.totalPending === 1 ? "" : "s"} awaiting review.\n\n${opts.sessions
      .map(
        (s) =>
          `${s.className} (${s.dayLabel} · ${s.timeLabel}): ${s.pendingCount} pending\n  ${s.pendingNames.slice(0, 12).join(", ")}${s.pendingNames.length > 12 ? `, …and ${s.pendingNames.length - 12} more` : ""}\n  ${SITE_URL}/admin/sessions/${s.sessionId}`,
      )
      .join("\n\n")}`,
  };
}
