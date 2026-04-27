"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
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
