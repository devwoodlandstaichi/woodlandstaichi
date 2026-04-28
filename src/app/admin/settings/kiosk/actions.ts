"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import {
  clearKioskPin,
  isValidPin,
  saveKioskPin,
} from "@/lib/settings/kiosk-pin";

export type SetPinState =
  | { ok: false; message: string }
  | { ok: true; message: string }
  | undefined;

export async function setPinAction(
  _prev: SetPinState,
  formData: FormData,
): Promise<SetPinState> {
  const me = await requireAdmin();

  const pin = String(formData.get("pin") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!isValidPin(pin)) {
    return { ok: false, message: "PIN must be 4–8 digits." };
  }
  if (pin !== confirm) {
    return { ok: false, message: "PINs don't match." };
  }

  try {
    await saveKioskPin(pin, me.id);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not save PIN.",
    };
  }

  revalidatePath("/admin/settings/kiosk");
  return { ok: true, message: "Kiosk PIN updated." };
}

export async function clearPinAction(): Promise<SetPinState> {
  await requireAdmin();
  try {
    await clearKioskPin();
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not clear PIN.",
    };
  }
  revalidatePath("/admin/settings/kiosk");
  return { ok: true, message: "Kiosk PIN removed. Exit no longer prompts." };
}

/** Verify endpoint for the kiosk Exit dialog. Auth-gated by
 * requireStaff at call site (the scanner is staff-only). */
export async function verifyPinAction(
  pin: string,
): Promise<{ ok: boolean }> {
  const { verifyKioskPin } = await import("@/lib/settings/kiosk-pin");
  // Lazy import keeps the secret-using module out of any client bundle
  // (server-only enforces this at runtime too).
  const ok = await verifyKioskPin(pin.trim());
  return { ok };
}
