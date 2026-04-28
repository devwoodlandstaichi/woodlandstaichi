import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Storage format for the PIN: "<salt>:<hmac-sha256(salt + pin, secret)>"
// Salt is 16 random bytes per write so two admins setting the same PIN
// don't produce identical stored values.

const KEY = "kiosk_pin_hash";

function getSecret(): string {
  const s = process.env.QR_TOKEN_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "QR_TOKEN_SECRET is not set or too short. Generate with: openssl rand -base64 48",
    );
  }
  return s;
}

function hashPin(pin: string, salt: string): string {
  return createHmac("sha256", getSecret())
    .update(salt + pin)
    .digest("base64url");
}

export function isValidPin(pin: string): boolean {
  // 4–8 digits. Numeric keypad-friendly; long enough to deter casual
  // guessing without being a hassle for a senior to enter.
  return /^\d{4,8}$/.test(pin);
}

/** Reads the stored PIN payload via the admin client to bypass RLS —
 * this lib is only imported from server actions, so never reaches a
 * browser. */
async function readStored(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  return (data?.value as string | undefined) ?? null;
}

export async function isKioskPinSet(): Promise<boolean> {
  return (await readStored()) !== null;
}

/** Stores the new hash. Caller is responsible for auth gating
 * (requireAdmin) before calling this. */
export async function saveKioskPin(
  pin: string,
  setByUserId: string,
): Promise<void> {
  if (!isValidPin(pin)) {
    throw new Error("PIN must be 4–8 digits.");
  }
  const salt = randomBytes(8).toString("base64url");
  const hash = hashPin(pin, salt);
  const value = `${salt}:${hash}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({
      key: KEY,
      value,
      updated_by_user_id: setByUserId,
    });
  if (error) throw new Error(error.message);
}

export async function clearKioskPin(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .delete()
    .eq("key", KEY);
  if (error) throw new Error(error.message);
}

/** Constant-time PIN check. Returns true if PIN matches the stored hash;
 * false if PIN doesn't match OR if no PIN is set (caller can decide
 * whether to short-circuit via isKioskPinSet first). */
export async function verifyKioskPin(pin: string): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const stored = await readStored();
  if (!stored) return false;

  const [salt, expectedB64] = stored.split(":");
  if (!salt || !expectedB64) return false;

  const computed = hashPin(pin, salt);
  const a = Buffer.from(computed);
  const b = Buffer.from(expectedB64);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
