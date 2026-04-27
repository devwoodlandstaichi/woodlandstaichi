"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/dal";
import {
  CLASS_LEVEL_VALUES,
  DAY_OF_WEEK_VALUES,
  type ClassLevel,
  type DayOfWeek,
} from "@/lib/format";

const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type FieldErrors = Record<string, string>;
type ClassInput = {
  name: string;
  level: ClassLevel;
  location: string;
  location_address: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  capacity: number | null;
  cohort_start_date: string | null;
  description: string | null;
  active: boolean;
  display_order: number;
};

// Raw string values, shaped for re-hydrating the form after a validation
// error so the user doesn't lose what they typed.
export type ClassFormValues = {
  name: string;
  level: string;
  location: string;
  location_address: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  capacity: string;
  cohort_start_date: string;
  description: string;
  active: boolean;
  display_order: string;
};

export type ClassFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: ClassFormValues;
    }
  | { ok: true }
  | undefined;

function valuesFrom(formData: FormData): ClassFormValues {
  return {
    name: str(formData, "name"),
    level: str(formData, "level"),
    location: str(formData, "location"),
    location_address: str(formData, "location_address"),
    day_of_week: str(formData, "day_of_week"),
    start_time: str(formData, "start_time"),
    end_time: str(formData, "end_time"),
    capacity: str(formData, "capacity"),
    cohort_start_date: str(formData, "cohort_start_date"),
    description: str(formData, "description"),
    active: formData.get("active") === "on",
    display_order: str(formData, "display_order"),
  };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function parse(
  formData: FormData,
): { data: ClassInput } | { errors: FieldErrors } {
  const errors: FieldErrors = {};

  const name = str(formData, "name");
  const level = str(formData, "level");
  const location = str(formData, "location");
  const location_address = str(formData, "location_address");
  const day_of_week = str(formData, "day_of_week");
  const start_time = str(formData, "start_time");
  const end_time = str(formData, "end_time");
  const capacityRaw = str(formData, "capacity");
  const cohort_start_date = str(formData, "cohort_start_date");
  const description = str(formData, "description");
  const active = formData.get("active") === "on";
  const displayOrderRaw = str(formData, "display_order");

  if (name.length < 2) errors.name = "Name is required.";
  if (!CLASS_LEVEL_VALUES.includes(level as ClassLevel))
    errors.level = "Pick a level.";
  if (location.length < 2) errors.location = "Location is required.";
  if (!DAY_OF_WEEK_VALUES.includes(day_of_week as DayOfWeek))
    errors.day_of_week = "Pick a day.";
  if (!TIME_RE.test(start_time)) errors.start_time = "Use HH:MM.";
  if (!TIME_RE.test(end_time)) errors.end_time = "Use HH:MM.";
  if (!errors.start_time && !errors.end_time && end_time <= start_time)
    errors.end_time = "End must be after start.";

  let capacity: number | null = null;
  if (capacityRaw) {
    const n = Number(capacityRaw);
    if (!Number.isInteger(n) || n <= 0 || n > 999)
      errors.capacity = "Positive whole number.";
    else capacity = n;
  }

  if (cohort_start_date && !DATE_RE.test(cohort_start_date))
    errors.cohort_start_date = "Use YYYY-MM-DD.";

  let display_order = 0;
  if (displayOrderRaw) {
    const n = Number(displayOrderRaw);
    if (!Number.isInteger(n) || n < 0 || n > 9999)
      errors.display_order = "Whole number 0–9999.";
    else display_order = n;
  }

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      name,
      level: level as ClassLevel,
      location,
      location_address: location_address || null,
      day_of_week: day_of_week as DayOfWeek,
      start_time,
      end_time,
      capacity,
      cohort_start_date: cohort_start_date || null,
      description: description || null,
      active,
      display_order,
    },
  };
}

export async function createClass(
  _prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert(parsed.data);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/"); // public schedule
  redirect("/admin/classes");
}

export async function updateClass(
  id: string,
  _prev: ClassFormState,
  formData: FormData,
): Promise<ClassFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/classes");
  revalidatePath(`/admin/classes/${id}/edit`);
  revalidatePath("/");
  redirect("/admin/classes");
}

export async function archiveClass(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("classes").update({ active: false }).eq("id", id);
  revalidatePath("/admin/classes");
  revalidatePath("/");
}

export async function unarchiveClass(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("classes").update({ active: true }).eq("id", id);
  revalidatePath("/admin/classes");
  revalidatePath("/");
}

// Hard delete — cascades to class_sessions, registrations, and attendance
// (via the foreign keys defined in 20260427000000_initial_schema.sql).
// Use archive for the common "remove from public schedule" case; this is
// for genuinely-mistaken rows.
export async function deleteClass(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", id);
  revalidatePath("/admin/classes");
  revalidatePath("/");
  redirect("/admin/classes");
}
