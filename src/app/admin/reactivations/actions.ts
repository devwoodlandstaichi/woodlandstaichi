"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import { sendEmail } from "@/lib/email/send";
import {
  memberApproved,
  memberRejected,
} from "@/lib/email/reactivation";

async function loadRequest(supabase: ReturnType<typeof createClient> extends Promise<infer C> ? C : never, id: string) {
  return supabase
    .from("member_reactivation_requests")
    .select(
      "id, member_id, email, status, members:member_id(first_name, last_name, email)",
    )
    .eq("id", id)
    .maybeSingle();
}

export async function approveReactivation(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data } = await loadRequest(supabase, id);
  if (!data || data.status !== "pending") return;

  const member = Array.isArray(data.members) ? data.members[0] : data.members;
  if (!member) return;

  await supabase
    .from("member_reactivation_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: reviewer.id,
      reviewer_note: null,
    })
    .eq("id", id);

  // Flip the member's status back to active so they show on rosters
  // and admin tooling treats them like a current member.
  await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", data.member_id);

  await sendEmail(
    memberApproved({
      memberName: `${member.first_name} ${member.last_name}`.trim(),
      memberEmail: member.email,
    }),
  );

  revalidatePath("/admin/reactivations");
  revalidatePath("/admin");
  revalidatePath("/admin/members");
}

export async function rejectReactivation(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("reviewer_note") ?? "").trim() || null;
  if (!id) return;

  const supabase = await createClient();
  const { data } = await loadRequest(supabase, id);
  if (!data || data.status !== "pending") return;

  const member = Array.isArray(data.members) ? data.members[0] : data.members;
  if (!member) return;

  await supabase
    .from("member_reactivation_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: reviewer.id,
      reviewer_note: note,
    })
    .eq("id", id);

  await sendEmail(
    memberRejected({
      memberName: `${member.first_name} ${member.last_name}`.trim(),
      memberEmail: member.email,
      note,
    }),
  );

  revalidatePath("/admin/reactivations");
  revalidatePath("/admin");
}
