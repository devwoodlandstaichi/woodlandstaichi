import "server-only";

import QRCode from "qrcode";

const COMMON_OPTS = {
  errorCorrectionLevel: "M" as const,
  margin: 2,
  width: 480,
  color: {
    dark: "#0a0806", // ink
    light: "#f8f5f0", // parchment
  },
};

/** Returns a data: URL of the QR as PNG, suitable for direct embedding
 * in <img src> or for printing. */
export async function qrPngDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    ...COMMON_OPTS,
    type: "image/png",
  });
}

/** Returns the raw PNG bytes — for email attachments. */
export async function qrPngBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    ...COMMON_OPTS,
    type: "png",
  });
}
