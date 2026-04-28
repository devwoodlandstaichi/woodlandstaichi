"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
