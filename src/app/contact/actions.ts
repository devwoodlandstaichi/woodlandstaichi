"use server";

import { sendEmail } from "@/lib/email/send";

export type ContactFormState =
  | undefined
  | {
      ok: true;
    }
  | {
      ok: false;
      message?: string;
      errors?: Partial<Record<"name" | "email" | "phone" | "message", string>>;
      values?: {
        name?: string;
        email?: string;
        phone?: string;
        message?: string;
      };
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function submitContactForm(
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot — real users leave it empty. Pretend success on hit.
  if ((formData.get("website") as string)?.trim()) {
    return { ok: true };
  }

  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const message = ((formData.get("message") as string) ?? "").trim();

  const values = { name, email, phone, message };
  const errors: NonNullable<
    Extract<ContactFormState, { ok: false }>["errors"]
  > = {};

  if (!name) errors.name = "Please tell us your name.";
  else if (name.length > 120) errors.name = "Name is too long.";

  if (!email) errors.email = "Please share an email so we can reply.";
  else if (!EMAIL_RE.test(email) || email.length > 200)
    errors.email = "That doesn't look like a valid email.";

  if (phone && phone.length > 40) errors.phone = "Phone is too long.";

  if (!message) errors.message = "Please write a short message.";
  else if (message.length < 10)
    errors.message = "A bit more detail helps us reply well.";
  else if (message.length > 4000)
    errors.message = "Message is too long (max 4,000 characters).";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  const to = process.env.CONTACT_TO || "info@woodlandstaichi.com";
  const subject = `Website contact — ${name}`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">
      <h2 style="font-size:18px;margin:0 0 14px;font-weight:600">New message from the website</h2>
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td style="padding:4px 0">${escape(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td style="padding:4px 0"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Phone</td><td style="padding:4px 0">${escape(phone)}</td></tr>` : ""}
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <div style="white-space:pre-wrap">${escape(message)}</div>
    </div>
  `;
  const text = [
    `New message from the website`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    ``,
    message,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const result = await sendEmail({
    to,
    subject,
    html,
    text,
  });

  if (!result.ok) {
    return {
      ok: false,
      message:
        "We couldn't send your message. Please email info@woodlandstaichi.com directly.",
      values,
    };
  }

  return { ok: true };
}
