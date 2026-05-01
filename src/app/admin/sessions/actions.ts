"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireStaff } from "@/lib/auth/dal";
import { type DayOfWeek } from "@/lib/format";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_TO_IDX: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export type GenerateState =
  | { ok: false; message: string }
  | { ok: true; inserted: number; spanned: number }
  | undefined;

function eachDateInRange(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function generateTerm(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  await requireStaff();

  const startStr = String(formData.get("start_date") ?? "");
  const endStr = String(formData.get("end_date") ?? "");

  if (!DATE_RE.test(startStr) || !DATE_RE.test(endStr)) {
    return { ok: false, message: "Use YYYY-MM-DD for both dates." };
  }
  if (endStr < startStr) {
    return { ok: false, message: "End date must be on or after start date." };
  }

  const start = new Date(startStr + "T00:00:00Z");
  const end = new Date(endStr + "T00:00:00Z");
  // Cap at one year — guards against fat-fingered date pickers.
  const ONE_YEAR_MS = 366 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > ONE_YEAR_MS) {
    return { ok: false, message: "Span is over a year — pick a shorter range." };
  }

  const supabase = await createClient();
  const { data: classes, error: classErr } = await supabase
    .from("classes")
    .select("id,day_of_week,start_time,end_time,active")
    .eq("active", true);

  if (classErr) return { ok: false, message: classErr.message };

  const dates = eachDateInRange(start, end);
  type SessionRow = {
    class_id: string;
    session_date: string;
    start_time: string;
    end_time: string;
  };
  const rows: SessionRow[] = [];

  for (const c of classes ?? []) {
    const targetIdx = DAY_TO_IDX[c.day_of_week as DayOfWeek];
    for (const d of dates) {
      if (d.getUTCDay() === targetIdx) {
        rows.push({
          class_id: c.id,
          session_date: toIso(d),
          start_time: c.start_time,
          end_time: c.end_time,
        });
      }
    }
  }

  if (rows.length === 0) {
    return {
      ok: true,
      inserted: 0,
      spanned: dates.length,
    };
  }

  // Use admin client + ON CONFLICT DO NOTHING (via upsert with ignoreDuplicates)
  // so re-running is idempotent on the (class_id, session_date) unique index.
  const admin = createAdminClient();
  const { error: insertErr, count } = await admin
    .from("class_sessions")
    .upsert(rows, {
      onConflict: "class_id,session_date",
      ignoreDuplicates: true,
      count: "exact",
    });

  if (insertErr) return { ok: false, message: insertErr.message };

  revalidatePath("/admin/sessions");

  return {
    ok: true,
    inserted: count ?? 0,
    spanned: dates.length,
  };
}

// ---------------------------------------------------------------------------
// Delete actions
// ---------------------------------------------------------------------------

export type DeleteResult =
  | { ok: true; deleted: number; attendanceWiped: number }
  | { ok: false; message: string };

/** Delete a single session by id. Cascades any attendance rows on it
 * via the FK declared in the initial schema. */
export async function deleteSession(sessionId: string): Promise<DeleteResult> {
  await requireStaff();
  if (!sessionId) return { ok: false, message: "Missing session id." };

  const supabase = await createClient();

  const { count: attendanceCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("class_session_id", sessionId);

  const { error } = await supabase
    .from("class_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/sessions");
  revalidatePath("/admin/attendance");
  return {
    ok: true,
    deleted: 1,
    attendanceWiped: attendanceCount ?? 0,
  };
}

// Bulk delete sessions inside an inclusive date range. Admin-only —
// destructive enough that we don't want instructors firing it. Mirrors
// the typed-DELETE gate from /admin/members clearAllMembers so the
// header-button-modal flow works the same way.
export type BulkDeleteState =
  | { ok: false; message: string }
  | { ok: true; deleted: number; attendanceWiped: number }
  | undefined;

export async function deleteSessionsInRange(
  _prev: BulkDeleteState,
  formData: FormData,
): Promise<BulkDeleteState> {
  await requireAdmin();

  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { ok: false, message: "Type DELETE to confirm." };
  }

  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const onlyEmpty = formData.get("only_empty") === "on";

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { ok: false, message: "Use YYYY-MM-DD for both dates." };
  }
  if (endDate < startDate) {
    return { ok: false, message: "End date must be on or after start date." };
  }

  const supabase = await createClient();

  const { data: candidates, error: candErr } = await supabase
    .from("class_sessions")
    .select("id, attendance(count)")
    .gte("session_date", startDate)
    .lte("session_date", endDate);

  if (candErr) return { ok: false, message: candErr.message };

  type Cand = { id: string; attendance: { count: number }[] | null };
  const all = (candidates ?? []) as Cand[];

  const deletable = onlyEmpty
    ? all.filter((c) => (c.attendance?.[0]?.count ?? 0) === 0)
    : all;

  if (deletable.length === 0) {
    return { ok: true, deleted: 0, attendanceWiped: 0 };
  }

  const ids = deletable.map((c) => c.id);
  const attendanceWiped = deletable.reduce(
    (n, c) => n + (c.attendance?.[0]?.count ?? 0),
    0,
  );

  const admin = createAdminClient();
  const { error: delErr } = await admin
    .from("class_sessions")
    .delete()
    .in("id", ids);

  if (delErr) return { ok: false, message: delErr.message };

  revalidatePath("/admin/sessions");
  revalidatePath("/admin/attendance");
  return {
    ok: true,
    deleted: ids.length,
    attendanceWiped,
  };
}

// ---------------------------------------------------------------------------
// Newcomer-friendly toggle. Per-session flag — separate from the
// class.level enum — so an instructor can mark specific drop-in
// dates where a curious first-timer is welcome without changing the
// class itself.
// ---------------------------------------------------------------------------

export async function setSessionCapacity(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const raw = formData.get("capacity");
  const value = typeof raw === "string" ? raw.trim() : "";
  const capacity = value === "" ? null : Number(value);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) return;
  const supabase = await createClient();
  await supabase
    .from("class_sessions")
    .update({ capacity })
    .eq("id", id);
  revalidatePath("/admin/sessions");
}

export async function toggleNewcomerFriendly(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("class_sessions")
    .update({ newcomer_friendly: next })
    .eq("id", id);
  revalidatePath("/admin/sessions");
}
