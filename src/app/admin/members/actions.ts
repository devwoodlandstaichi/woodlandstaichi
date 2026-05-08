"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireStaff } from "@/lib/auth/dal";
import { processMemberPhoto } from "@/lib/image/process-photo";
import {
  MEMBER_LEVEL_VALUES,
  MEMBER_SEX_VALUES,
  MEMBER_STATUS_VALUES,
  type MemberLevel,
  type MemberSex,
  type MemberStatus,
} from "@/lib/format";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^[\d\s().+-]{7,}$/;
const PHOTO_BUCKET = "member-photos";

type FieldErrors = Record<string, string>;

export type MemberFormValues = {
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  birthday: string;
  sex: string;
  level: string;
  status: string;
  physical_limitations: string;
  prior_experience: string;
  found_us_via: string;
  expectations: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_phone: string;
};

export type MemberFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: MemberFormValues;
    }
  | { ok: true }
  | undefined;

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function valuesFrom(formData: FormData): MemberFormValues {
  return {
    first_name: str(formData, "first_name"),
    last_name: str(formData, "last_name"),
    nickname: str(formData, "nickname"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    street: str(formData, "street"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    postal_code: str(formData, "postal_code"),
    birthday: str(formData, "birthday"),
    sex: str(formData, "sex"),
    level: str(formData, "level"),
    status: str(formData, "status"),
    physical_limitations: str(formData, "physical_limitations"),
    prior_experience: str(formData, "prior_experience"),
    found_us_via: str(formData, "found_us_via"),
    expectations: str(formData, "expectations"),
    emergency_contact_name: str(formData, "emergency_contact_name"),
    emergency_contact_relationship: str(
      formData,
      "emergency_contact_relationship",
    ),
    emergency_phone: str(formData, "emergency_phone"),
  };
}

type MemberPatch = {
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string;
  phone: string;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  birthday: string | null;
  sex: MemberSex | null;
  level: MemberLevel;
  status: MemberStatus;
  physical_limitations: string | null;
  prior_experience: string | null;
  found_us_via: string | null;
  expectations: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_phone: string | null;
};

function parse(
  formData: FormData,
  opts: { requireSex?: boolean } = {},
): { data: MemberPatch } | { errors: FieldErrors } {
  const errors: FieldErrors = {};
  const v = valuesFrom(formData);

  if (v.first_name.length < 1) errors.first_name = "Required.";
  if (v.last_name.length < 1) errors.last_name = "Required.";
  if (!v.email || !/^.+@.+\..+$/.test(v.email)) errors.email = "Valid email required.";
  if (!v.phone || !PHONE_RE.test(v.phone)) errors.phone = "Valid phone required.";

  if (!(MEMBER_LEVEL_VALUES as readonly string[]).includes(v.level))
    errors.level = "Pick a level.";
  if (!(MEMBER_STATUS_VALUES as readonly string[]).includes(v.status))
    errors.status = "Pick a status.";

  if (v.birthday && !DATE_RE.test(v.birthday))
    errors.birthday = "Use YYYY-MM-DD.";

  // Sex is required on create (matches the public registration form)
  // but optional on edit so historical members imported without it
  // (e.g. CSV imports) don't get blocked when staff fix something else
  // on their row. When present, it must be a valid enum value.
  if (opts.requireSex && !v.sex) {
    errors.sex = "Pick one.";
  }
  if (v.sex && !(MEMBER_SEX_VALUES as readonly string[]).includes(v.sex)) {
    errors.sex = "Invalid value.";
  }

  if (v.emergency_phone && !PHONE_RE.test(v.emergency_phone))
    errors.emergency_phone = "Valid phone or leave blank.";

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      first_name: v.first_name,
      last_name: v.last_name,
      nickname: v.nickname || null,
      email: v.email,
      phone: v.phone,
      street: v.street || null,
      city: v.city || null,
      state: v.state || null,
      postal_code: v.postal_code || null,
      birthday: v.birthday || null,
      sex: v.sex ? (v.sex as MemberSex) : null,
      level: v.level as MemberLevel,
      status: v.status as MemberStatus,
      physical_limitations: v.physical_limitations || null,
      prior_experience: v.prior_experience || null,
      found_us_via: v.found_us_via || null,
      expectations: v.expectations || null,
      emergency_contact_name: v.emergency_contact_name || null,
      emergency_contact_relationship:
        v.emergency_contact_relationship || null,
      emergency_phone: v.emergency_phone || null,
    },
  };
}

export async function updateMember(
  id: string,
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireStaff();
  const parsed = parse(formData);
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return { ok: false, message: error.message, values: valuesFrom(formData) };
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  revalidatePath(`/admin/members/${id}/edit`);
  redirect(`/admin/members/${id}`);
}

/** Admin-create — bypasses /classes/register. Used when staff enter a
 * member from a paper form, an email, etc. Sex is required on create
 * (matches the public registration shape). Email collision is detected
 * up front so the founder gets a friendly "this person already exists"
 * pointer instead of a Postgres unique-constraint error. */
export async function createMember(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireStaff();
  const parsed = parse(formData, { requireSex: true });
  if ("errors" in parsed) {
    return { ok: false, errors: parsed.errors, values: valuesFrom(formData) };
  }

  const supabase = await createClient();

  // Email collision check — case-insensitive. Block before INSERT and
  // surface a message that points at the existing row, so the founder
  // can edit there instead of accidentally double-creating.
  const { data: existing } = await supabase
    .from("members")
    .select("id, first_name, last_name")
    .ilike("email", parsed.data.email)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      message: `That email is already on file for ${existing.first_name} ${existing.last_name}. Open their profile at /admin/members/${existing.id} to edit.`,
      errors: { email: "Already used by another member." },
      values: valuesFrom(formData),
    };
  }

  const { data: row, error } = await supabase
    .from("members")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !row) {
    return {
      ok: false,
      message: error?.message ?? "Could not create member.",
      values: valuesFrom(formData),
    };
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members/${row.id}`);
}

async function setMemberStatus(id: string, status: MemberStatus) {
  await requireStaff();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("members").update({ status }).eq("id", id);
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  revalidatePath("/admin/registrations");
}

export async function markActive(formData: FormData) {
  return setMemberStatus(String(formData.get("id") ?? ""), "active");
}
export async function markWaitlist(formData: FormData) {
  return setMemberStatus(String(formData.get("id") ?? ""), "waitlist");
}
export async function markInactive(formData: FormData) {
  return setMemberStatus(String(formData.get("id") ?? ""), "inactive");
}

// Selection-aware bulk operations invoked from the members table's
// right-click context menu. Status changes are staff-allowed (consistent
// with the per-row mark* actions); delete is admin-only because there's
// no undo and it cascades to attendance + registrations.

export async function bulkSetMemberStatus(
  ids: string[],
  status: MemberStatus,
): Promise<{ ok: true; updated: number } | { ok: false; message: string }> {
  await requireStaff();
  const cleanIds = ids.filter((id) => typeof id === "string" && id.length > 0);
  if (cleanIds.length === 0) return { ok: true, updated: 0 };
  if (!(MEMBER_STATUS_VALUES as readonly string[]).includes(status)) {
    return { ok: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("members")
    .update({ status }, { count: "exact" })
    .in("id", cleanIds);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/members");
  revalidatePath("/admin/registrations");
  return { ok: true, updated: count ?? 0 };
}

export async function bulkSetMemberLevel(
  ids: string[],
  level: MemberLevel,
): Promise<{ ok: true; updated: number } | { ok: false; message: string }> {
  await requireStaff();
  const cleanIds = ids.filter((id) => typeof id === "string" && id.length > 0);
  if (cleanIds.length === 0) return { ok: true, updated: 0 };
  if (!(MEMBER_LEVEL_VALUES as readonly string[]).includes(level)) {
    return { ok: false, message: "Invalid level." };
  }

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("members")
    .update({ level }, { count: "exact" })
    .in("id", cleanIds);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/members");
  return { ok: true, updated: count ?? 0 };
}

export async function deleteMembers(
  ids: string[],
): Promise<{ ok: true; deleted: number } | { ok: false; message: string }> {
  await requireAdmin();
  const cleanIds = ids.filter((id) => typeof id === "string" && id.length > 0);
  if (cleanIds.length === 0) return { ok: true, deleted: 0 };

  const admin = createAdminClient();

  // Collect any photo paths first so we can purge them from Storage
  // after the row delete cascades. Storage doesn't have FK cascade.
  const { data: photos } = await admin
    .from("members")
    .select("photo_path")
    .in("id", cleanIds);
  const paths = (photos ?? [])
    .map((r) => r.photo_path as string | null)
    .filter((p): p is string => !!p);

  const { error, count } = await admin
    .from("members")
    .delete({ count: "exact" })
    .in("id", cleanIds);

  if (error) return { ok: false, message: error.message };

  if (paths.length > 0) {
    await admin.storage.from(PHOTO_BUCKET).remove(paths);
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  return { ok: true, deleted: count ?? 0 };
}

// DESTRUCTIVE — deletes every row in public.members and cascades to
// public.attendance + public.registrations. Admin-only (instructors cannot
// invoke). The UI requires the user to type "DELETE" to enable the button,
// and we re-verify here. Uses the service-role client so RLS doesn't even
// enter the picture for the bulk delete.
export type ClearState =
  | { ok: false; message: string }
  | { ok: true; deleted: number }
  | undefined;

export async function clearAllMembers(
  _prev: ClearState,
  formData: FormData,
): Promise<ClearState> {
  await requireAdmin();

  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { ok: false, message: "Type DELETE to confirm." };
  }

  const admin = createAdminClient();

  // Drain photo paths first so we can wipe Storage after the row delete.
  const { data: photos } = await admin
    .from("members")
    .select("photo_path")
    .gte("created_at", "1970-01-01");
  const paths = (photos ?? [])
    .map((r) => r.photo_path as string | null)
    .filter((p): p is string => !!p);

  const { count, error } = await admin
    .from("members")
    .delete({ count: "exact" })
    .gte("created_at", "1970-01-01"); // PostgREST requires a filter; this matches all rows.

  if (error) {
    return { ok: false, message: error.message };
  }

  if (paths.length > 0) {
    await admin.storage.from(PHOTO_BUCKET).remove(paths);
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin");

  return { ok: true, deleted: count ?? 0 };
}

// Photo upload / replace / clear, plus the photo_public visibility
// toggle. Staff-side gates on requireStaff(); the matching self-serve
// action lives in /members/me/actions.ts and gates on auth.uid().
export type PhotoState =
  | { ok: false; message: string }
  | { ok: true }
  | undefined;

export type PhotoVisibilityState =
  | { ok: false; message: string }
  | { ok: true; photo_public: boolean }
  | undefined;

export async function setMemberPhoto(
  id: string,
  _prev: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  await requireStaff();
  if (!id) return { ok: false, message: "Missing member id." };

  const remove = formData.get("remove_photo") === "1";
  const file = formData.get("photo");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("members")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();
  const existingPath = (existing?.photo_path as string | null) ?? null;

  // Explicit removal takes precedence over any uploaded file.
  if (remove) {
    if (existingPath) {
      await admin.storage.from(PHOTO_BUCKET).remove([existingPath]);
    }
    const { error } = await admin
      .from("members")
      .update({ photo_url: null, photo_path: null })
      .eq("id", id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/${id}`);
    revalidatePath(`/admin/members/${id}/edit`);
    revalidatePath("/members/me");
    return { ok: true };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pick a photo to upload." };
  }

  const processed = await processMemberPhoto(file);
  if (!processed.ok) return { ok: false, message: processed.message };

  const path = `${crypto.randomUUID()}.${processed.ext}`;
  const { error: uploadErr } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, processed.buffer, {
      contentType: processed.contentType,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadErr) return { ok: false, message: uploadErr.message };

  // Replace previous file only after the new upload succeeds.
  if (existingPath) {
    await admin.storage.from(PHOTO_BUCKET).remove([existingPath]);
  }

  const { data: urlData } = admin.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(path);

  const { error: updateErr } = await admin
    .from("members")
    .update({ photo_url: urlData.publicUrl, photo_path: path })
    .eq("id", id);
  if (updateErr) return { ok: false, message: updateErr.message };

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  revalidatePath(`/admin/members/${id}/edit`);
  revalidatePath("/members/me");
  return { ok: true };
}

export async function setMemberPhotoPublic(
  id: string,
  _prev: PhotoVisibilityState,
  formData: FormData,
): Promise<PhotoVisibilityState> {
  await requireStaff();
  if (!id) return { ok: false, message: "Missing member id." };

  const next = formData.get("photo_public") === "1";
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ photo_public: next })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  revalidatePath(`/admin/members/${id}/edit`);
  revalidatePath("/members/me");
  revalidatePath("/about/instructors");
  return { ok: true, photo_public: next };
}
