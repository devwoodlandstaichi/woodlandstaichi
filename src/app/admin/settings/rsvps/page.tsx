import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/ui";
import { RsvpSettingsForm } from "./settings-form";

export const metadata = { title: "RSVP rules" };
export const dynamic = "force-dynamic";

const FALLBACK_MATRIX: Record<string, string[]> = {
  instructor: [
    "instructor",
    "advanced",
    "intermediate",
    "beginners",
    "remedial",
    "play_only",
    "combined",
  ],
  advanced: ["advanced", "intermediate", "beginners", "play_only", "combined"],
  intermediate: ["intermediate", "beginners", "play_only", "combined"],
  beginners: ["beginners", "remedial", "combined"],
};

export default async function RsvpSettingsPage() {
  await requireAdmin();
  // app_settings is service-role-only by RLS, so we read with admin
  // client here — the page is admin-gated.
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("rsvp_cutoff_minutes, rsvp_level_matrix")
    .limit(1)
    .maybeSingle();

  const cutoff = data?.rsvp_cutoff_minutes ?? 240;
  const matrix =
    (data?.rsvp_level_matrix as Record<string, string[]> | null) ??
    FALLBACK_MATRIX;

  return (
    <>
      <PageHeader
        title="RSVP rules"
        description="Cutoff window and the level matrix that controls which class levels each member tier can see in their Sessions tab."
        helpTopic="settings-rsvps"
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12">
        <RsvpSettingsForm cutoffMinutes={cutoff} matrix={matrix} />
      </div>
    </>
  );
}
