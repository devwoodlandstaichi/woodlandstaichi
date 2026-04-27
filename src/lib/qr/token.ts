import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

// Format: <member-token-uuid>.<base64url-hmac-sha256(uuid)>
//
// The first segment is what we store in members.qr_token. The signature
// makes the QR unforgeable — we can verify on scan without a DB lookup
// per attempted forgery, and we can revoke a member's QR by setting
// qr_token = null without needing key rotation.

const SECRET_ENV = "QR_TOKEN_SECRET";

function getSecret(): string {
  const s = process.env[SECRET_ENV];
  if (!s || s.length < 16) {
    throw new Error(
      `${SECRET_ENV} is not set or too short. Generate one with: openssl rand -base64 48`,
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

/** Generates a fresh QR token. The first part is what we persist on the
 * member row; the full string is what gets encoded into the QR PNG. */
export function issueQrToken(): { tokenId: string; encoded: string } {
  const tokenId = randomUUID();
  const sig = sign(tokenId);
  return { tokenId, encoded: `${tokenId}.${sig}` };
}

/** Validates the signature; returns the inner tokenId on success.
 * Constant-time comparison so we don't leak signature data via timing. */
export function verifyQrToken(encoded: string): string | null {
  if (typeof encoded !== "string") return null;
  const dot = encoded.indexOf(".");
  if (dot < 1) return null;

  const tokenId = encoded.slice(0, dot);
  const provided = encoded.slice(dot + 1);
  // UUID v4 length sanity-check before HMAC work.
  if (tokenId.length < 8 || tokenId.length > 64) return null;

  let expected: string;
  try {
    expected = sign(tokenId);
  } catch {
    return null;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? tokenId : null;
}
