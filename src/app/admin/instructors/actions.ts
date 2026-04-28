"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";

const TIERS = ["founder", "senior", "instructor", "assistant"] as const;
type Tier = (typeof TIERS)[number];

type FieldErrors = Record<string, string>;

export type InstructorFormValues = {
  name: string;
  tier: string;
  title: string;
  bio: string;
  display_order: string;
  active: boolean;
};

export type InstructorFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: InstructorFormValues;
    }
  | { ok: true }
  | undefined;

function isTier(v: unknown): v is Tier {
  return typeof v === "string" && (TIERS as readonly string[]).includes(v);
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function valuesFrom(formData: FormData): InstructorFormValues {
  return {
    name: str(formData, "name"),
    tier: str(formData, "tier"),
    title: str(formData, "title"),
    bio: str(formData, "bio"),
    display_order: str(formData, "display_order"),
    active: formData.get("active") === "on",
  };
}

type Patch = {
  name: string;
  tier: Tier;
  title: string | null;
  bio: string | null;
  display_order: number;
  active: boolean;
};

function parse(formData: FormData): { data: Patch } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const v = valuesFrom(formData);

  if (v.name.length < 2) errors.name = "Name is required.";
  if (!isTier(v.tier)) errors.tier = "Pick a tier.";

  let display_order = 0;
  if (v.display_order) {
    const n = Number(v.display_order);
    if (!Number.isInteger(n) || n < 0 || n > 9999)
      errors.display_order = "Whole number 0–9999.";
    else display_order = n;
  }

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      name: v.name,
      tier: v.tier as Tier,
      title: v.title || null,
      bio: v.bio || null,
      display_order,
      active: v.active,
    },
  };
}

/** Upload an image File to the instructor-photos bucket via the
 * service-role client (so we don't depend on the user's session for
 * storage RLS). Returns the public URL or null if no file. */
async function uploadPhoto(
  file: File | null,
  instructorId: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be 5 MB or smaller.");
  }
  const ext = file.type === "image/png"
    ? "png"
    : file.type === "image/webp"
      ? "webp"
      : "jpg";
  const path = `${instructorId}-${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage
    .from("instructor-photos")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
  if (error) throw new Error(error.message);

  const { data } = admin.storage.from("instructor-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createInstructor(
  _prev: InstructorFormState,
  formData: FormData,
): Promise<InstructorFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("instructors")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !created) {
    return {
      ok: false,
      message: error?.message ?? "Could not create.",
      values: valuesFrom(formData),
    };
  }

  // Optional photo upload
  try {
    const photoFile = formData.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const url = await uploadPhoto(photoFile, created.id);
      if (url) {
        await supabase
          .from("instructors")
          .update({ photo_url: url })
          .eq("id", created.id);
      }
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Photo upload failed.",
      values: valuesFrom(formData),
    };
  }

  revalidatePath("/admin/instructors");
  revalidatePath("/about/instructors");
  redirect("/admin/instructors");
}

export async function updateInstructor(
  id: string,
  _prev: InstructorFormState,
  formData: FormData,
): Promise<InstructorFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instructors")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return {
      ok: false,
      message: error.message,
      values: valuesFrom(formData),
    };
  }

  // Optional photo replace
  try {
    const photoFile = formData.get("photo") as File | null;
    if (photoFile && photoFile.size > 0) {
      const url = await uploadPhoto(photoFile, id);
      if (url) {
        await supabase
          .from("instructors")
          .update({ photo_url: url })
          .eq("id", id);
      }
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Photo upload failed.",
      values: valuesFrom(formData),
    };
  }

  revalidatePath("/admin/instructors");
  revalidatePath(`/admin/instructors/${id}/edit`);
  revalidatePath("/about/instructors");
  redirect("/admin/instructors");
}

export async function clearPhoto(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("instructors").update({ photo_url: null }).eq("id", id);
  revalidatePath("/admin/instructors");
  revalidatePath(`/admin/instructors/${id}/edit`);
  revalidatePath("/about/instructors");
}

async function setActive(id: string, active: boolean) {
  await requireStaff();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("instructors").update({ active }).eq("id", id);
  revalidatePath("/admin/instructors");
  revalidatePath("/about/instructors");
}

export async function activateInstructor(formData: FormData) {
  return setActive(String(formData.get("id") ?? ""), true);
}
export async function deactivateInstructor(formData: FormData) {
  return setActive(String(formData.get("id") ?? ""), false);
}

export async function deleteInstructor(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("instructors").delete().eq("id", id);
  revalidatePath("/admin/instructors");
  revalidatePath("/about/instructors");
}
