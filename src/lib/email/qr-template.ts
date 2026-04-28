/** Stable Content-ID used in the HTML <img src="cid:..."> below.
 * Must match the contentId on the attachment when the email is sent. */
export const QR_EMAIL_CID = "wtc-attendance-qr";

/** HTML email body for delivering a member's attendance QR. The labeled
 * PNG is sent as an inline attachment with a Content-ID and referenced
 * via `cid:` so it renders in Gmail, Apple Mail, and Outlook. Earlier
 * versions used a data: URL but Gmail strips long data URLs.
 * Save-to-Photos / Wallet hints sit below the image. */
export function qrEmailHtml(opts: {
  firstName: string;
}): string {
  const { firstName } = opts;
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px;background:#f8f5f0;font-family:Georgia,serif;color:#15110d">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e6e0d4">
      <tr>
        <td style="padding:40px 36px 24px;text-align:center">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.45em;text-transform:uppercase;color:#7a6e5e">
            Woodlands Tai Chi
          </p>
          <h1 style="margin:0;font-size:30px;line-height:1.1;font-weight:500;letter-spacing:-0.01em">
            Hello, ${escape(firstName)}.
          </h1>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.6;color:#3a342c">
            Here is your attendance QR. Bring it to class on your phone — show it to an instructor at the start of each session and you&apos;ll be marked present.
          </p>
        </td>
      </tr>

      <tr>
        <td align="center" style="padding:0 36px 8px">
          <img src="cid:${QR_EMAIL_CID}" alt="Woodlands Tai Chi attendance QR for ${escape(firstName)}"
            width="320" style="display:block;width:100%;max-width:320px;height:auto;border:1px solid #e6e0d4;border-radius:12px">
        </td>
      </tr>

      <tr>
        <td style="padding:24px 36px 8px">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#7a6e5e">
            <span style="display:inline-block;height:1px;width:20px;background:#a91d1d;vertical-align:middle;margin-right:8px"></span>
            Save it on your phone
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;line-height:1.6;color:#3a342c">
                <strong style="color:#15110d">iPhone</strong> &middot; Long-press the QR image above &rarr; <em>Save to Photos</em>. Then in <strong>Wallet</strong> tap <strong>+</strong> &rarr; <em>Code</em> &rarr; <em>Take Photo of Code</em> and pick the QR from your photos.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;line-height:1.6;color:#3a342c">
                <strong style="color:#15110d">Android</strong> &middot; Long-press the image &rarr; <em>Save image</em>. <strong>Google Wallet</strong> users: tap and hold and pick <em>Add to Google Wallet</em> if your phone supports it; otherwise the image in Photos works fine.
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;line-height:1.6;color:#3a342c">
                <strong style="color:#15110d">Or just keep this email.</strong> Pull it up at the start of class — that works too.
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td style="padding:18px 36px 36px;font-size:13px;line-height:1.6;color:#3a342c;border-top:1px solid #efe9df">
          <p style="margin:0">
            <strong style="color:#a91d1d">If you lose your phone</strong>, reply to this email and we&apos;ll regenerate a fresh QR — your old one will stop working immediately for safety.
          </p>
          <p style="margin:14px 0 0;font-style:italic;color:#7a6e5e">
            Meditation in motion.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function qrEmailText(firstName: string): string {
  return `Hello, ${firstName}.

Here is your Woodlands Tai Chi attendance QR (attached as a PNG).

Bring it to class on your phone and show it to an instructor at the start of each session. You'll be marked present automatically.

How to save it on your phone:
- iPhone: long-press the QR image and Save to Photos. Then in Wallet, tap + → Code → Take Photo of Code and pick the saved image.
- Android: long-press → Save image. Some phones can Add to Google Wallet directly.
- Or just keep this email — pull it up at the start of class.

If you lose your phone, reply to this email and we'll regenerate a fresh QR. Your old one will stop working immediately for safety.

Meditation in motion.`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
