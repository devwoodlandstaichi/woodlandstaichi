"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const POSTER_BUCKET = "wtcd-posters";
const POSTER_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const POSTER_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type PosterChange =
  | { kind: "keep" }
  | { kind: "set"; url: string; path: string }
  | { kind: "clear" }
  | { kind: "error"; message: string };

// Mirrors resolveCoverChange in /admin/news/actions.ts. Storage writes
// go through the service-role admin client so they bypass storage RLS;
// the action's requireStaff() gate is the actual auth boundary.
async function resolvePosterChange(
  formData: FormData,
  existingPath: string | null,
): Promise<PosterChange> {
  const remove = formData.get("remove_poster") === "1";
  const file = formData.get("poster");

  if (remove) {
    if (existingPath) {
      const admin = createAdminClient();
      await admin.storage.from(POSTER_BUCKET).remove([existingPath]);
    }
    return { kind: "clear" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { kind: "keep" };
  }

  const ext = POSTER_EXTENSIONS[file.type];
  if (!ext) {
    return { kind: "error", message: "Poster must be JPEG, PNG, or WebP." };
  }
  if (file.size > POSTER_MAX_BYTES) {
    return { kind: "error", message: "Poster must be under 8 MB." };
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from(POSTER_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadErr) return { kind: "error", message: uploadErr.message };

  if (existingPath) {
    await admin.storage.from(POSTER_BUCKET).remove([existingPath]);
  }

  const { data: urlData } = admin.storage
    .from(POSTER_BUCKET)
    .getPublicUrl(path);
  return { kind: "set", url: urlData.publicUrl, path };
}

function applyPosterToPatch<T extends Record<string, unknown>>(
  patch: T,
  change: PosterChange,
): T {
  if (change.kind === "set") {
    return { ...patch, poster_url: change.url, poster_path: change.path };
  }
  if (change.kind === "clear") {
    return { ...patch, poster_url: null, poster_path: null };
  }
  return patch;
}

type FieldErrors = Record<string, string>;

export type WtcdFormValues = {
  year: string;
  event_date: string;
  location: string;
  intro: string;
  gallery_url: string;
  active: boolean;
};

export type WtcdFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: WtcdFormValues;
    }
  | { ok: true }
  | undefined;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function valuesFrom(formData: FormData): WtcdFormValues {
  return {
    year: str(formData, "year"),
    event_date: str(formData, "event_date"),
    location: str(formData, "location"),
    intro: str(formData, "intro"),
    gallery_url: str(formData, "gallery_url"),
    active: formData.get("active") === "on",
  };
}

type Patch = {
  year: number;
  event_date: string;
  location: string;
  intro: string | null;
  gallery_url: string | null;
  active: boolean;
};

function parse(formData: FormData): { data: Patch } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const v = valuesFrom(formData);

  let year = 0;
  if (!v.year) {
    errors.year = "Year is required.";
  } else {
    const n = Number(v.year);
    if (!Number.isInteger(n) || n < 2000 || n > 2100) {
      errors.year = "Whole year between 2000 and 2100.";
    } else {
      year = n;
    }
  }

  if (!v.event_date) {
    errors.event_date = "Event date is required.";
  } else if (!DATE_RE.test(v.event_date)) {
    errors.event_date = "Use YYYY-MM-DD.";
  } else if (year > 0) {
    // Cross-check: the event_date's year must match the Year field.
    // Stops easy-to-make picker mistakes (e.g. iOS date wheel defaulting
    // to 1980) from getting saved with a mismatched year.
    const dateYear = Number(v.event_date.slice(0, 4));
    if (dateYear !== year) {
      errors.event_date = `Event date year (${dateYear}) doesn't match Year (${year}).`;
    }
  }

  if (!v.location) {
    errors.location = "Location is required.";
  }

  let gallery_url: string | null = null;
  if (v.gallery_url) {
    try {
      const u = new URL(v.gallery_url);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        errors.gallery_url = "Enter an http or https URL or leave blank.";
      } else {
        gallery_url = v.gallery_url;
      }
    } catch {
      errors.gallery_url = "Enter a valid URL or leave blank.";
    }
  }

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      year,
      event_date: v.event_date,
      location: v.location,
      intro: v.intro || null,
      gallery_url,
      active: v.active,
    },
  };
}

export async function createEvent(
  _prev: WtcdFormState,
  formData: FormData,
): Promise<WtcdFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const poster = await resolvePosterChange(formData, null);
  if (poster.kind === "error") {
    return { ok: false, message: poster.message, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("wtcd_events")
    .insert(applyPosterToPatch(parsed.data, poster));
  if (error) {
    if (poster.kind === "set") {
      const admin = createAdminClient();
      await admin.storage.from(POSTER_BUCKET).remove([poster.path]);
    }
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/wtcd");
  revalidatePath("/world-tai-chi-day");
  redirect("/admin/wtcd");
}

export async function updateEvent(
  id: string,
  _prev: WtcdFormState,
  formData: FormData,
): Promise<WtcdFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wtcd_events")
    .select("poster_path")
    .eq("id", id)
    .maybeSingle();

  const poster = await resolvePosterChange(
    formData,
    (existing?.poster_path as string | null) ?? null,
  );
  if (poster.kind === "error") {
    return { ok: false, message: poster.message, values: valuesFrom(formData) };
  }

  const { error } = await supabase
    .from("wtcd_events")
    .update(applyPosterToPatch(parsed.data, poster))
    .eq("id", id);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/wtcd");
  revalidatePath("/world-tai-chi-day");
  redirect("/admin/wtcd");
}

async function setActive(id: string, active: boolean) {
  await requireStaff();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("wtcd_events").update({ active }).eq("id", id);
  revalidatePath("/admin/wtcd");
  revalidatePath("/world-tai-chi-day");
}

export async function activateEvent(formData: FormData) {
  return setActive(String(formData.get("id") ?? ""), true);
}
export async function deactivateEvent(formData: FormData) {
  return setActive(String(formData.get("id") ?? ""), false);
}

export async function deleteEvent(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wtcd_events")
    .select("poster_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("wtcd_events").delete().eq("id", id);

  if (existing?.poster_path) {
    const admin = createAdminClient();
    await admin.storage
      .from(POSTER_BUCKET)
      .remove([existing.poster_path as string]);
  }

  revalidatePath("/admin/wtcd");
  revalidatePath("/world-tai-chi-day");
  redirect("/admin/wtcd");
}
