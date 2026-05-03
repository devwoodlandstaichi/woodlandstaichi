import "server-only";

import sharp from "sharp";

// Member photo pipeline: take a raw upload (anything sharp can read —
// JPEG, PNG, WebP, HEIC if libvips supports it), produce a 900×1200 sRGB
// JPEG with EXIF stripped and orientation baked in. Stored size lands
// around 150–300 KB which is fine for ~75 active members on the free
// Supabase tier.

const MAX_INPUT_BYTES = 12 * 1024 * 1024; // 12 MB raw input cap
const TARGET_WIDTH = 900;
const TARGET_HEIGHT = 1200;
const JPEG_QUALITY = 82;

const READABLE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
]);

export type ProcessedPhoto =
  | { ok: true; buffer: Buffer; ext: "jpg"; contentType: "image/jpeg" }
  | { ok: false; message: string };

export async function processMemberPhoto(file: File): Promise<ProcessedPhoto> {
  if (!READABLE_MIMES.has(file.type)) {
    return {
      ok: false,
      message:
        "Photo must be a JPEG, PNG, WebP, HEIC, or AVIF image. Try sharing the photo from your library again.",
    };
  }
  if (file.size === 0) {
    return { ok: false, message: "The photo file is empty." };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return {
      ok: false,
      message: "Photo must be under 12 MB.",
    };
  }

  const arr = await file.arrayBuffer();

  try {
    // .rotate() with no args bakes the EXIF orientation tag, then sharp
    // strips all metadata by default on toBuffer — fixes the iPhone
    // landscape issue and the GPS-leak privacy concern in one step.
    // .resize with `cover` + `attention` center-crops to 3:4, biased
    // toward the most visually salient region (typically the face).
    const out = await sharp(Buffer.from(arr))
      .rotate()
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "cover",
        position: "attention",
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return { ok: true, buffer: out, ext: "jpg", contentType: "image/jpeg" };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `Couldn't process the image: ${err.message}`
          : "Couldn't process the image.",
    };
  }
}
