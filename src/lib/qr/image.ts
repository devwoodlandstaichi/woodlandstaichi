import "server-only";

import QRCode from "qrcode";
import sharp from "sharp";

const COMMON_OPTS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  width: 480,
  color: {
    dark: "#0a0806", // ink
    light: "#f8f5f0", // parchment
  },
};

/** Plain QR PNG as a data URL — for screen display where the surrounding
 * page already shows the member's name. */
export async function qrPngDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    ...COMMON_OPTS,
    type: "image/png",
  });
}

/** Plain QR PNG bytes (no label). */
export async function qrPngBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    ...COMMON_OPTS,
    type: "png",
  });
}

/** Labeled QR PNG — the QR with the school name above and the member name
 * below. Used for email attachments + inline email image so when a member
 * saves the picture (Photos / Apple Wallet / printed), the instructor can
 * read who they are at a glance during scanning.
 *
 * Composed as SVG (QR rendered as SVG, wrapped with <text> elements),
 * then rasterised via sharp. Output is 600×680 PNG, parchment background.
 */
export async function qrLabeledPngBuffer(
  payload: string,
  memberName: string,
): Promise<Buffer> {
  // Inner QR as SVG — gives us crisp vector that scales to whatever
  // box we put it in.
  const qrSvg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: COMMON_OPTS.color,
  });

  // Strip the outer <svg> wrapper from qrcode's output so we can reuse
  // the inner shapes inside our own coordinate system.
  const inner = qrSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  // Find the QR's intrinsic viewBox so we can scale it.
  const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/);
  const qrVB = viewBoxMatch ? viewBoxMatch[1] : "0 0 33 33";

  const W = 600;
  const H = 680;
  const QR_SIZE = 480;
  const QR_X = (W - QR_SIZE) / 2;
  const QR_Y = 110;

  const safeName = escapeXml(memberName);

  const composed = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#f8f5f0"/>

    <text x="${W / 2}" y="48" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="14" letter-spacing="4"
      fill="#7a6e5e">WOODLANDS TAI CHI</text>

    <line x1="${W / 2 - 24}" y1="58" x2="${W / 2 + 24}" y2="58"
      stroke="#a91d1d" stroke-width="1"/>

    <text x="${W / 2}" y="92" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="24" font-weight="500"
      fill="#15110d">${safeName}</text>

    <svg x="${QR_X}" y="${QR_Y}" width="${QR_SIZE}" height="${QR_SIZE}"
      viewBox="${qrVB}" preserveAspectRatio="xMidYMid meet">
      ${inner}
    </svg>

    <text x="${W / 2}" y="${H - 30}" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="11" letter-spacing="2"
      fill="#7a6e5e">ATTENDANCE ID · woodlandstaichi.com</text>
  </svg>`;

  return sharp(Buffer.from(composed)).png().toBuffer();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
