"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import { verifyQrToken } from "@/lib/qr/token";

export type RecordResult =
  | {
      ok: true;
      memberId: string;
      memberName: string;
      method: "qr" | "manual";
      duplicate: boolean;
    }
  | { ok: false; message: string };

async function writeAttendance(
  sessionId: string,
  memberId: string,
  method: "qr" | "manual",
  scannedByUserId: string | null,
): Promise<RecordResult> {
  const supabase = await createClient();

  // Resolve member name + level for the success toast.
  const { data: member } = await supabase
    .from("members")
    .select("id,first_name,last_name,nickname")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { ok: false, message: "Member not found." };
  }

  // Idempotent: the unique (member_id, class_session_id) constraint
  // means re-scanning is a no-op. We detect duplicates by checking
  // first.
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("member_id", memberId)
    .eq("class_session_id", sessionId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("attendance").insert({
      member_id: memberId,
      class_session_id: sessionId,
      method,
      scanned_by_user_id: scannedByUserId,
    });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/attendance/scan/${sessionId}`);

  return {
    ok: true,
    memberId: member.id,
    memberName: member.nickname
      ? `${member.first_name} (${member.nickname})`
      : `${member.first_name} ${member.last_name}`,
    method,
    duplicate: !!existing,
  };
}

export async function recordByToken(
  sessionId: string,
  encodedToken: string,
): Promise<RecordResult> {
  const user = await requireStaff();
  if (!sessionId) return { ok: false, message: "No class session selected." };

  const tokenId = verifyQrToken(encodedToken);
  if (!tokenId) {
    return { ok: false, message: "Invalid or expired QR code." };
  }

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("qr_token", tokenId)
    .maybeSingle();

  if (!member) {
    return { ok: false, message: "QR not recognised. Ask the member to regenerate." };
  }

  return writeAttendance(sessionId, member.id, "qr", user.id);
}

export async function recordByMember(
  sessionId: string,
  memberId: string,
): Promise<RecordResult> {
  const user = await requireStaff();
  if (!sessionId) return { ok: false, message: "No class session selected." };
  if (!memberId) return { ok: false, message: "No member selected." };
  return writeAttendance(sessionId, memberId, "manual", user.id);
}

/** Type-to-search across name, nickname, email — used by the manual
 * fallback in the scanner UI when a member can't show their QR. */
export async function searchMembers(
  query: string,
): Promise<Array<{ id: string; name: string; level: string }>> {
  await requireStaff();
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const safe = q.replace(/[,()*]/g, " ");
  const { data } = await supabase
    .from("members")
    .select("id,first_name,last_name,nickname,level")
    .or(
      [
        `first_name.ilike.*${safe}*`,
        `last_name.ilike.*${safe}*`,
        `nickname.ilike.*${safe}*`,
      ].join(","),
    )
    .neq("status", "inactive")
    .order("last_name", { ascending: true })
    .limit(8);

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.nickname
      ? `${m.last_name}, ${m.first_name} (${m.nickname})`
      : `${m.last_name}, ${m.first_name}`,
    level: m.level as string,
  }));
}
