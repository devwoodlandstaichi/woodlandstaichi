import "server-only";

import { Resend } from "resend";

export type EmailAttachment = {
  filename: string;
  /** Raw bytes, will be base64-encoded by the SDK. */
  content: Buffer;
  /** Optional Content-ID for inline embedding. Reference in HTML via
   * `<img src="cid:<contentId>">`. Required when the image must
   * render inline in clients that strip data: URLs (notably Gmail). */
  contentId?: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

/** Thin wrapper around Resend so server actions can call sendEmail
 * without thinking about config. If RESEND_API_KEY isn't set, returns
 * an explicit error rather than silently dropping the message. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      message:
        "Email not configured. Set RESEND_API_KEY in .env.local (sign up at resend.com — free tier covers 3,000/mo).",
    };
  }

  const from =
    process.env.EMAIL_FROM ||
    "Woodlands Tai Chi <noreply@woodlandstaichi.com>";

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        ...(a.contentId ? { content_id: a.contentId } : {}),
      })),
    });
    if (error) return { ok: false, message: error.message };
    if (!data) return { ok: false, message: "No response from Resend." };
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Email send failed.",
    };
  }
}
