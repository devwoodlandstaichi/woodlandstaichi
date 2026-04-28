/** HTML email body for delivering a member's attendance QR. The PNG is
 * sent as an attachment AND embedded inline via cid-style data URL (fall-
 * back). Most modern clients render the data URL fine. */
export function qrEmailHtml(opts: {
  firstName: string;
  pngDataUrl: string;
}): string {
  const { firstName, pngDataUrl } = opts;
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px;background:#f8f5f0;font-family:Georgia,serif;color:#15110d">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #e6e0d4">
      <tr>
        <td style="padding:40px 36px 28px;text-align:center">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.45em;text-transform:uppercase;color:#7a6e5e">
            Woodlands Tai Chi
          </p>
          <h1 style="margin:0;font-size:30px;line-height:1.1;font-weight:500;letter-spacing:-0.01em">
            Hello, ${escape(firstName)}.
          </h1>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.6;color:#3a342c">
            Here is your attendance QR code. Bring it to class on your phone — show it to an instructor at the start of each session and you&apos;ll be marked present.
          </p>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:0 36px 24px">
          <img src="${pngDataUrl}" alt="Attendance QR" width="240" height="240" style="display:block;border:1px solid #e6e0d4;border-radius:12px;background:#f8f5f0;padding:8px">
          <p style="margin:14px 0 0;font-size:12px;color:#7a6e5e">
            Save this image, screenshot it, or just keep this email handy.
          </p>
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

Here is your Woodlands Tai Chi attendance QR code (attached as a PNG).
Bring it to class on your phone and show it to an instructor at the start of each session — you'll be marked present.

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
