import "server-only";

import QRCode from "qrcode";

/** Returns a data: URL of the QR as PNG, suitable for direct embedding
 * in <img src> or for printing. Quiet-zone matches our crest aesthetic. */
export async function qrPngDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 2,
    width: 480,
    color: {
      dark: "#0a0806", // ink
      light: "#f8f5f0", // parchment
    },
  });
}
