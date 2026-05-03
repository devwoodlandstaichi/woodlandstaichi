"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { processMemberPhoto } from "@/lib/image/process-photo";
import {
  type PhotoState,
  type PhotoVisibilityState,
} from "@/app/admin/members/actions";

const PHOTO_BUCKET = "member-photos";

export type ProfileFormState =
  | undefined
  | { ok: true }
  | {
      ok: false;
      message?: string;
      errors?: Partial<
        Record<
          | "nickname"
          | "phone"
          | "street"
          | "city"
          | "state"
          | "postal_code"
          | "bio",
          string
        >
      >;
      values?: {
        nickname?: string;
        phone?: string;
        street?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        bio?: string;
      };
    };

const PHONE_RE = /^[\d\s().+-]{7,}$/;

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out." };

  const nickname = ((formData.get("nickname") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const street = ((formData.get("street") as string) ?? "").trim();
  const city = ((formData.get("city") as string) ?? "").trim();
  const state = ((formData.get("state") as string) ?? "").trim();
  const postal_code = ((formData.get("postal_code") as string) ?? "").trim();
  const bio = ((formData.get("bio") as string) ?? "").trim();

  const values = {
    nickname,
    phone,
    street,
    city,
    state,
    postal_code,
    bio,
  };
  const errors: NonNullable<
    Extract<ProfileFormState, { ok: false }>["errors"]
  > = {};

  if (!phone) errors.phone = "A contact phone is required.";
  else if (!PHONE_RE.test(phone) || phone.length > 40)
    errors.phone = "Please enter a valid phone number.";

  if (nickname.length > 100) errors.nickname = "Nickname is too long.";
  if (street.length > 200) errors.street = "Street is too long.";
  if (city.length > 100) errors.city = "City is too long.";
  if (state.length > 50) errors.state = "State is too long.";
  if (postal_code.length > 20) errors.postal_code = "ZIP is too long.";
  if (bio.length > 4000) errors.bio = "Bio is too long (max 4,000 characters).";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  // Update via the user's RLS-scoped client first so we honour the
  // "members update self" policy. Fall back to admin client if the row
  // hasn't been linked yet.
  const payload = {
    nickname: nickname || null,
    phone,
    street: street || null,
    city: city || null,
    state: state || null,
    postal_code: postal_code || null,
    bio: bio || null,
  };

  const { data: existing, error: readErr } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) {
    return {
      ok: false,
      message:
        "We couldn't load your profile. Please reload and try again.",
      values,
    };
  }

  if (!existing) {
    return {
      ok: false,
      message:
        "We couldn't find your member record yet. Email info@woodlandstaichi.com so we can link it.",
      values,
    };
  }

  const { error: updateErr } = await supabase
    .from("members")
    .update(payload)
    .eq("id", existing.id);

  if (updateErr) {
    return {
      ok: false,
      message:
        "We couldn't save your profile. Please try again or email info@woodlandstaichi.com.",
      values,
    };
  }

  revalidatePath("/members/me");
  // Public instructor cards inherit member.bio when linked; refresh that
  // page too so a freshly-edited bio appears immediately.
  revalidatePath("/about/instructors");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Self-serve photo upload — same pipeline as the admin setMemberPhoto
// but the row is keyed off auth.uid() → members.user_id instead of an
// admin-supplied id. Uses the service-role admin client only because
// the storage bucket's RLS grants writes to staff; the action's auth
// gate (must own the matching member row) is the real boundary.
// ---------------------------------------------------------------------------

export async function setOwnMemberPhoto(
  _prev: PhotoState,
  formData: FormData,
): Promise<PhotoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("members")
    .select("id, photo_path")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) {
    return {
      ok: false,
      message:
        "We couldn't find your member record yet. Email info@woodlandstaichi.com so we can link it.",
    };
  }
  const memberId = existing.id as string;
  const existingPath = (existing.photo_path as string | null) ?? null;

  const remove = formData.get("remove_photo") === "1";
  if (remove) {
    if (existingPath) {
      await admin.storage.from(PHOTO_BUCKET).remove([existingPath]);
    }
    const { error } = await admin
      .from("members")
      .update({ photo_url: null, photo_path: null })
      .eq("id", memberId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/members/me");
    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/${memberId}`);
    return { ok: true };
  }

  const file = formData.get("photo");
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

  if (existingPath) {
    await admin.storage.from(PHOTO_BUCKET).remove([existingPath]);
  }

  const { data: urlData } = admin.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(path);

  const { error: updateErr } = await admin
    .from("members")
    .update({ photo_url: urlData.publicUrl, photo_path: path })
    .eq("id", memberId);
  if (updateErr) return { ok: false, message: updateErr.message };

  revalidatePath("/members/me");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/about/instructors");
  return { ok: true };
}

export async function setOwnPhotoPublic(
  _prev: PhotoVisibilityState,
  formData: FormData,
): Promise<PhotoVisibilityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out." };

  const next = formData.get("photo_public") === "1";
  const { data, error } = await supabase
    .from("members")
    .update({ photo_public: next })
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) {
    return {
      ok: false,
      message:
        "We couldn't find your member record yet. Email info@woodlandstaichi.com so we can link it.",
    };
  }

  revalidatePath("/members/me");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${data.id}`);
  revalidatePath("/about/instructors");
  return { ok: true, photo_public: next };
}

// ---------------------------------------------------------------------------
// Self-submitted testimonial — Phase 5.1.
// Member writes a quote → action inserts row with status='pending', the
// admin queue picks it up at /admin/testimonials?status=pending. The
// "members submit testimonials" RLS policy enforces that the row's
// member_id matches a row owned by auth.uid(), and that status='pending'
// + active=false (so a member can't self-publish).
// ---------------------------------------------------------------------------

export type TestimonialSubmitState =
  | undefined
  | { ok: true }
  | {
      ok: false;
      message?: string;
      errors?: Partial<Record<"quote" | "attribution", string>>;
      values?: { quote?: string; attribution?: string };
    };

export async function submitTestimonial(
  _state: TestimonialSubmitState,
  formData: FormData,
): Promise<TestimonialSubmitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out." };

  const quote = ((formData.get("quote") as string) ?? "").trim();
  const attribution = ((formData.get("attribution") as string) ?? "").trim();
  const values = { quote, attribution };

  const errors: NonNullable<
    Extract<TestimonialSubmitState, { ok: false }>["errors"]
  > = {};
  if (quote.length < 30)
    errors.quote = "Tell us a little more — at least 30 characters.";
  else if (quote.length > 2000) errors.quote = "Please keep it under 2000 characters.";
  if (attribution.length > 200)
    errors.attribution = "Attribution is too long (max 200 characters).";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, values };
  }

  // Need the member row id (the policy keys off member_id).
  const { data: member } = await supabase
    .from("members")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return {
      ok: false,
      message:
        "We couldn't find your member record. Email info@woodlandstaichi.com so we can link it.",
      values,
    };
  }

  const memberName = `${member.first_name} ${member.last_name}`.trim();
  const { error } = await supabase.from("testimonials").insert({
    member_id: member.id,
    member_name: memberName,
    attribution: attribution || null,
    quote,
    status: "pending",
    active: false,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    return {
      ok: false,
      message:
        "We couldn't submit your testimonial. Please try again or email info@woodlandstaichi.com.",
      values,
    };
  }

  revalidatePath("/members/me");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// First-time password setup
// Members who signed in via magic-link OTP have an auth.users row but no
// password. /members/me gates everything else on having one set so they
// can sign in normally next time without going through email each visit.
// ---------------------------------------------------------------------------

const PASSWORD_RULES_MSG =
  "Password must be at least 12 characters and include upper-case, lower-case, and a digit.";

function passwordOk(p: string): boolean {
  return p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);
}

export type SetPasswordState =
  | undefined
  | { ok: false; message: string };

export async function setInitialPassword(
  _state: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out." };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!passwordOk(password)) return { ok: false, message: PASSWORD_RULES_MSG };
  if (password !== confirm)
    return { ok: false, message: "Passwords don't match." };

  // Set the password AND flag user_metadata.password_set so the gate
  // knows this was a deliberate user choice. We can't trust
  // auth.users.encrypted_password to detect "real password" — GoTrue
  // assigns a placeholder hash to magic-link users so the column is
  // always populated.
  const { error } = await supabase.auth.updateUser({
    password,
    data: { password_set: true },
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/members/me");
  redirect("/members/me");
}

/** Best-effort: link auth user to a member row by matching email. Used on
 * first visit after sign-up so the member can edit their profile without
 * an admin manually wiring auth.users.id → members.user_id. */
export async function linkSelfByEmail(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { ok: false, message: "Signed out." };

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("members")
    .select("id,user_id,email")
    .eq("email", user.email)
    .maybeSingle();
  if (!row) return { ok: false, message: "No member record matches your email." };
  if (row.user_id === user.id) return { ok: true };
  if (row.user_id && row.user_id !== user.id) {
    return {
      ok: false,
      message: "Your email is already linked to a different account.",
    };
  }
  await admin
    .from("members")
    .update({ user_id: user.id })
    .eq("id", row.id);
  return { ok: true };
}
