import "server-only";

// Email templates for the class registration lifecycle.
//   1. Member confirmation when they submit /classes/register.
//   2. Admin notice on every new registration so the queue isn't a
//      thing the founder has to remember to check.
//   3. Approval email when admin marks paid/waived (member transitions
//      waitlist → active). Includes /members/me + QR badge guidance.
//   4. Denial email if admin explicitly declines a registration.
//
// Markup matches reactivation.ts — inline styles, editorial tone.

const SCHOOL = "Woodlands Tai Chi";
const ADMIN_INBOX =
  process.env.WTC_ADMIN_INBOX || "info@woodlandstaichi.com";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://woodlandstaichi.com";

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

export function memberRegistrationAck(opts: {
  memberName: string;
  memberEmail: string;
  classLabel: string;
  paymentMethod: string | null;
}) {
  const paymentLine = opts.paymentMethod
    ? `<p style="font-size:16px;">You selected <strong>${opts.paymentMethod}</strong> for the shirt fee. Please send payment to the school using the instructions you received during registration. We&rsquo;ll mark you confirmed once it lands.</p>`
    : `<p style="font-size:16px;">We&rsquo;ll be in touch with shirt-fee payment instructions shortly.</p>`;

  return {
    to: opts.memberEmail,
    subject: "We got your registration",
    html: wrap(
      "Welcome — almost.",
      `
      <p style="font-size:16px;">Hi ${opts.memberName},</p>
      <p style="font-size:16px;">We received your registration for <strong>${opts.classLabel}</strong>. Sifu and the volunteers will review it and confirm your spot soon.</p>
      ${paymentLine}
      <p style="font-size:16px;">If anything has changed about your contact information or health, just reply to this email. Otherwise, we&rsquo;ll see you in class.</p>
      `,
    ),
    text: `Hi ${opts.memberName},\n\nWe received your registration for ${opts.classLabel}. Sifu and the volunteers will review it and confirm your spot soon.\n\n${
      opts.paymentMethod
        ? `You selected ${opts.paymentMethod} for the shirt fee. Please send payment using the instructions you received during registration. We'll mark you confirmed once it lands.`
        : "We'll be in touch with shirt-fee payment instructions shortly."
    }\n\nReply to this email if your contact information or health has changed.\n\n${SCHOOL} — ${SITE_URL}`,
  };
}

export function adminRegistrationNotice(opts: {
  memberName: string;
  memberEmail: string;
  classLabel: string;
  paymentMethod: string | null;
  shirtSize: string | null;
  registrationId: string;
}) {
  const queueUrl = `${SITE_URL}/admin/registrations`;
  return {
    to: ADMIN_INBOX,
    subject: `New registration — ${opts.memberName}`,
    html: wrap(
      "A new registration arrived.",
      `
      <p style="font-size:16px;"><strong>${opts.memberName}</strong> (${opts.memberEmail}) just registered for <strong>${opts.classLabel}</strong>.</p>
      <ul style="font-size:15px; padding-left:20px;">
        ${opts.shirtSize ? `<li>Shirt size: ${opts.shirtSize}</li>` : ""}
        ${opts.paymentMethod ? `<li>Payment method: ${opts.paymentMethod}</li>` : ""}
      </ul>
      <p style="font-size:16px;">Mark paid once funds land — that auto-activates them on the roster:</p>
      <p>
        <a href="${queueUrl}" style="display:inline-block; background:#1c1815; color:#fffaf3; padding:12px 24px; text-decoration:none; border-radius:999px; font-weight:500;">
          Open queue →
        </a>
      </p>
      <p style="font-size:13px; color:#7a716a; margin-top:24px;">Registration id: ${opts.registrationId}</p>
      `,
    ),
    text: `${opts.memberName} (${opts.memberEmail}) just registered for ${opts.classLabel}.${
      opts.shirtSize ? `\nShirt size: ${opts.shirtSize}` : ""
    }${
      opts.paymentMethod ? `\nPayment method: ${opts.paymentMethod}` : ""
    }\n\nMark paid once funds land:\n${queueUrl}\n\nRegistration id: ${opts.registrationId}`,
  };
}

export function memberRegistrationApproved(opts: {
  memberName: string;
  memberEmail: string;
  classLabel: string;
  /** true if a fresh QR was minted as part of approval, so the member
   * knows to expect a follow-up email or to check /members/me. */
  qrIssued: boolean;
}) {
  const portalUrl = `${SITE_URL}/members/me`;
  const qrLine = opts.qrIssued
    ? `<p style="font-size:16px;">We&rsquo;ve also issued an attendance QR for you. Sign in below to view it on your phone — or wait for the standalone QR email coming soon.</p>`
    : "";

  return {
    to: opts.memberEmail,
    subject: "You're confirmed for class",
    html: wrap(
      "You're in.",
      `
      <p style="font-size:16px;">Hi ${opts.memberName},</p>
      <p style="font-size:16px;">Your registration for <strong>${opts.classLabel}</strong> is confirmed. We&rsquo;ll see you on the first day — wear comfortable, loose clothes and arrive a few minutes early so we can introduce you.</p>
      ${qrLine}
      <p style="font-size:16px;"><strong>Set up your member account.</strong> You can update your contact info, upload a photo, and view your class history at the member portal:</p>
      <p>
        <a href="${portalUrl}" style="display:inline-block; background:#c84134; color:#fffaf3; padding:12px 24px; text-decoration:none; border-radius:999px; font-weight:500;">
          Sign in to the portal →
        </a>
      </p>
      <p style="font-size:14px; color:#7a716a;">Use the same email as your registration. We&rsquo;ll email you a one-time code to sign in — you can set a password from the portal once you&rsquo;re in.</p>
      `,
    ),
    text: `Hi ${opts.memberName},\n\nYour registration for ${opts.classLabel} is confirmed. We'll see you on the first day — wear loose clothes and arrive a few minutes early.\n\n${
      opts.qrIssued
        ? "We've also issued an attendance QR for you. Sign in below to view it.\n\n"
        : ""
    }Set up your member account at ${portalUrl}. Use the same email as your registration; we'll email you a one-time code.\n\n${SCHOOL} — ${SITE_URL}`,
  };
}

export function memberRegistrationDenied(opts: {
  memberName: string;
  memberEmail: string;
  classLabel: string;
  reason: string | null;
}) {
  const reasonHtml = opts.reason
    ? `<p style="font-size:16px; padding:14px 16px; background:#f6f2ec; border-radius:8px; margin:16px 0;"><em>From the founder:</em><br />${opts.reason.replace(/\n/g, "<br />")}</p>`
    : "";
  const reasonText = opts.reason ? `\n\nFrom the founder:\n${opts.reason}\n` : "";

  return {
    to: opts.memberEmail,
    subject: "About your registration",
    html: wrap(
      "A note from the school.",
      `
      <p style="font-size:16px;">Hi ${opts.memberName},</p>
      <p style="font-size:16px;">Thanks for your interest in <strong>${opts.classLabel}</strong>. We&rsquo;re not able to enroll you this session.</p>
      ${reasonHtml}
      <p style="font-size:16px;">If you&rsquo;d like to talk this through, please reply to this email or write to ${ADMIN_INBOX}.</p>
      `,
    ),
    text: `Hi ${opts.memberName},\n\nThanks for your interest in ${opts.classLabel}. We're not able to enroll you this session.${reasonText}\n\nReply or write to ${ADMIN_INBOX} to talk it through.\n\n${SCHOOL}`,
  };
}
