"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/dal";

const MEMBER_LEVELS = ["instructor", "advanced", "intermediate", "beginners"] as const;
const CLASS_LEVELS = [
  "instructor",
  "advanced",
  "intermediate",
  "beginners",
  "remedial",
  "play_only",
  "combined",
] as const;

export type RsvpSettingsState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | undefined;

export async function updateRsvpSettings(
  _prev: RsvpSettingsState,
  formData: FormData,
): Promise<RsvpSettingsState> {
  await requireAdmin();

  const cutoffStr = String(formData.get("rsvp_cutoff_minutes") ?? "");
  const cutoff = Number.parseInt(cutoffStr, 10);
  if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 60 * 24 * 7) {
    return {
      ok: false,
      message: "Cutoff must be a whole number of minutes between 0 and 10080 (1 week).",
    };
  }

  // Build matrix from the checkbox grid: name="matrix.<member_level>.<class_level>"
  const matrix: Record<string, string[]> = {};
  for (const ml of MEMBER_LEVELS) {
    matrix[ml] = [];
    for (const cl of CLASS_LEVELS) {
      if (formData.get(`matrix.${ml}.${cl}`) === "on") {
        matrix[ml].push(cl);
      }
    }
  }

  // Use admin client because app_settings is service-role-only by RLS.
  const admin = createAdminClient();

  // app_settings is a single-row config table. If a row exists, update;
  // otherwise insert.
  const { data: existing } = await admin
    .from("app_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from("app_settings")
      .update({
        rsvp_cutoff_minutes: cutoff,
        rsvp_level_matrix: matrix,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await admin
      .from("app_settings")
      .insert({
        rsvp_cutoff_minutes: cutoff,
        rsvp_level_matrix: matrix,
      });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/admin/settings/rsvps");
  revalidatePath("/members/me/sessions");
  return { ok: true, message: "Settings saved." };
}
