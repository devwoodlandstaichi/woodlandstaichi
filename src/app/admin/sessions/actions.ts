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
    .eq("active", true)
    .eq("is_one_off", false);

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
 * via the FK declared in the initial schema. If the session belongs to
 * a one-off event class (1:1 by construction), the parent classes row
 * is removed too so we don't accumulate orphan one-off classes. */
export async function deleteSession(sessionId: string): Promise<DeleteResult> {
  await requireStaff();
  if (!sessionId) return { ok: false, message: "Missing session id." };

  const supabase = await createClient();

  const { count: attendanceCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("class_session_id", sessionId);

  // Check if this session belongs to a one-off event class so we can
  // also tidy up the parent.
  const { data: parent } = await supabase
    .from("class_sessions")
    .select("class_id, classes!inner(id, is_one_off)")
    .eq("id", sessionId)
    .maybeSingle();
  const parentClass = parent?.classes
    ? Array.isArray(parent.classes)
      ? parent.classes[0]
      : parent.classes
    : null;
  const oneOffClassId =
    parentClass && (parentClass as { is_one_off?: boolean }).is_one_off
      ? (parentClass as { id: string }).id
      : null;

  const { error } = await supabase
    .from("class_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { ok: false, message: error.message };

  if (oneOffClassId) {
    const admin = createAdminClient();
    await admin.from("classes").delete().eq("id", oneOffClassId);
  }

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

// ---------------------------------------------------------------------------
// One-off events. Each event is a parent classes row flagged
// is_one_off=true plus a single class_sessions row carrying the date.
// The pair is created in two writes; we rollback the class row if the
// session insert fails so we don't accumulate orphan classes.
// ---------------------------------------------------------------------------

const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const CLASS_LEVELS = [
  "beginners",
  "intermediate",
  "advanced",
  "remedial",
  "play_only",
  "combined",
] as const;
type ClassLevel = (typeof CLASS_LEVELS)[number];

function isClassLevel(v: unknown): v is ClassLevel {
  return typeof v === "string" && (CLASS_LEVELS as readonly string[]).includes(v);
}

const ISO_DAY: Record<number, DayOfWeek> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export type CreateEventState =
  | { ok: true; sessionId: string }
  | {
      ok: false;
      message: string;
      values?: Record<string, string>;
      fieldErrors?: Record<string, string>;
    }
  | undefined;

// Snapshot every string entry in the form so we can echo it back in
// the error response. React 19 wipes uncontrolled inputs after a
// server-action call; the client re-keys the form and reads these
// values as `defaultValue` / `defaultChecked`.
//
// Checkboxes are special: an unchecked checkbox sends *nothing*, so
// `formData.entries()` can't tell "user unchecked it" from "the
// checkbox was never on the form". We list expected checkbox names
// and stamp an explicit "on" / "off" so the form's defaultChecked
// re-applies the user's actual choice.
function snapshotValues(
  formData: FormData,
  checkboxes: readonly string[] = [],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  for (const name of checkboxes) {
    out[name] = formData.has(name) ? "on" : "off";
  }
  return out;
}

/** Create a one-off event: a hidden parent classes row + a single
 * class_sessions row. Returns the new session id on success so the
 * client can redirect into /admin/sessions/[id] for review. */
export async function createOneOffSession(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  await requireStaff();

  const v = snapshotValues(formData, [
    "newcomer_friendly",
    "accepting_rsvps",
  ]);
  const fieldErrors: Record<string, string> = {};

  const name = (v.name ?? "").trim();
  if (!name) fieldErrors.name = "Required.";
  else if (name.length > 200) fieldErrors.name = "Too long (200 max).";

  const level = (v.level ?? "").trim();
  if (!isClassLevel(level)) fieldErrors.level = "Pick a level.";

  const location = (v.location ?? "").trim();
  if (!location) fieldErrors.location = "Required.";

  const session_date = (v.session_date ?? "").trim();
  if (!DATE_RE.test(session_date))
    fieldErrors.session_date = "Use YYYY-MM-DD.";

  const start_time = (v.start_time ?? "").trim();
  const end_time = (v.end_time ?? "").trim();
  if (!TIME_RE.test(start_time)) fieldErrors.start_time = "Use HH:MM.";
  if (!TIME_RE.test(end_time)) fieldErrors.end_time = "Use HH:MM.";
  if (
    TIME_RE.test(start_time) &&
    TIME_RE.test(end_time) &&
    end_time <= start_time
  ) {
    fieldErrors.end_time = "Must be after start.";
  }

  const capacityRaw = (v.capacity ?? "").trim();
  let capacity: number | null = null;
  if (capacityRaw !== "") {
    const n = Number.parseInt(capacityRaw, 10);
    if (!Number.isFinite(n) || n < 0)
      fieldErrors.capacity = "Whole number ≥ 0 (or leave blank).";
    else capacity = n;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Fix the highlighted fields.",
      values: v,
      fieldErrors,
    };
  }

  const location_address = (v.location_address ?? "").trim() || null;
  const description = (v.description ?? "").trim() || null;
  const newcomer_friendly = v.newcomer_friendly === "on";
  const accepting_rsvps = v.accepting_rsvps !== "off";

  // Day-of-week is derived from the actual session date so the parent
  // class row has a sensible value even though it's never used for
  // recurring scheduling.
  const dateUtc = new Date(`${session_date}T00:00:00Z`);
  const day_of_week = ISO_DAY[dateUtc.getUTCDay()];

  const admin = createAdminClient();

  // Step 1 — parent class row, hidden from recurring-class lists.
  const { data: classRow, error: classErr } = await admin
    .from("classes")
    .insert({
      name,
      level: level as ClassLevel,
      location,
      location_address,
      day_of_week,
      start_time,
      end_time,
      capacity,
      description,
      active: true,
      is_one_off: true,
      display_order: 0,
    })
    .select("id")
    .single();

  if (classErr || !classRow?.id) {
    return {
      ok: false,
      message: classErr?.message ?? "Failed to create event.",
      values: v,
    };
  }

  // Step 2 — the single session row. If this fails we roll back the
  // class row so we don't accumulate orphan one-off classes.
  const { data: sessionRow, error: sessionErr } = await admin
    .from("class_sessions")
    .insert({
      class_id: classRow.id,
      session_date,
      start_time,
      end_time,
      capacity,
      newcomer_friendly,
      accepting_rsvps,
    })
    .select("id")
    .single();

  if (sessionErr || !sessionRow?.id) {
    await admin.from("classes").delete().eq("id", classRow.id);
    return {
      ok: false,
      message: sessionErr?.message ?? "Failed to create session.",
      values: v,
    };
  }

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  revalidatePath("/classes");
  revalidatePath("/classes/register");

  return { ok: true, sessionId: sessionRow.id };
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
