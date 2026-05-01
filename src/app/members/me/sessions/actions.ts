"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Member submits a request to attend a class session. Always lands
 * in 'pending'; admin decides next. Inactive / waitlisted members
 * shouldn't be able to reach this — the page hides the form — but we
 * gate again here. RLS allows the insert too (status='pending', own
 * member_id), so this is mostly server-side defense in depth. */
export async function requestRsvp(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: member } = await supabase
    .from("members")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.status !== "active") return;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null;
  const ua = h.get("user-agent") || null;

  await supabase.from("session_rsvps").insert({
    class_session_id: sessionId,
    member_id: member.id,
    status: "pending",
    request_ip: ip,
    request_user_agent: ua,
  });

  revalidatePath("/members/me/sessions");
}

/** Member cancels their own RSVP (any prior status). Uses the admin
 * client because RLS only grants members SELECT + INSERT — never
 * UPDATE — so this server action is the controlled path. We verify
 * ownership before mutating. Soft cancel: row stays for audit, status
 * flips to 'cancelled'. */
export async function cancelRsvp(formData: FormData): Promise<void> {
  const rsvpId = String(formData.get("id") ?? "");
  if (!rsvpId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("session_rsvps")
    .select("id, member_id, status, members:member_id(user_id)")
    .eq("id", rsvpId)
    .maybeSingle();
  if (!row) return;
  const ownerUserId = Array.isArray(row.members)
    ? row.members[0]?.user_id
    : (row.members as { user_id: string | null } | null)?.user_id;
  if (ownerUserId !== user.id) return;
  if (row.status === "cancelled" || row.status === "rejected") return;

  await admin
    .from("session_rsvps")
    .update({ status: "cancelled" })
    .eq("id", rsvpId);

  revalidatePath("/members/me/sessions");
}
