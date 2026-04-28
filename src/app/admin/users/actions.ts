"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getSessionUser } from "@/lib/auth/dal";

export type AppRole = "admin" | "instructor";

const ROLE_VALUES = ["admin", "instructor"] as const;

type FieldErrors = Record<string, string>;

export type UserFormState =
  | {
      ok: false;
      message?: string;
      errors?: FieldErrors;
      values?: { email: string; role: string };
    }
  | { ok: true }
  | undefined;

function isRole(v: unknown): v is AppRole {
  return typeof v === "string" && (ROLE_VALUES as readonly string[]).includes(v);
}

export async function createUserAndRole(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "instructor");

  const errors: FieldErrors = {};
  if (!/^.+@.+\..+$/.test(email)) errors.email = "Valid email required.";
  if (password.length < 12)
    errors.password = "Password must be at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    errors.password =
      "Use a mix of upper-case, lower-case letters, and digits.";
  if (!isRole(role)) errors.role = "Pick a role.";

  if (Object.keys(errors).length) {
    return { ok: false, errors, values: { email, role } };
  }

  const admin = createAdminClient();

  // Create the auth user with email pre-confirmed so they can log in
  // immediately. They can change their password via /login/forgot.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created?.user) {
    return {
      ok: false,
      message: createErr?.message ?? "Could not create user.",
      values: { email, role },
    };
  }

  // Promote in user_roles
  const supabase = await createClient();
  const { error: roleErr } = await supabase
    .from("user_roles")
    .upsert({ user_id: created.user.id, role: role as AppRole });

  if (roleErr) {
    // Roll back the auth user so we don't end up with orphans.
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      ok: false,
      message: roleErr.message,
      values: { email, role },
    };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export type RoleChangeResult =
  | { ok: true }
  | { ok: false; message: string };

export async function changeUserRole(
  formData: FormData,
): Promise<RoleChangeResult> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId) return { ok: false, message: "Missing user id." };
  if (!isRole(role)) return { ok: false, message: "Invalid role." };

  const supabase = await createClient();

  // Last-admin guard: if we're about to demote a current admin, refuse
  // unless at least one other admin exists. Same intent as the
  // removeUser guard — never let the school end up with no admins.
  if (role !== "admin") {
    const { data: thisRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (thisRole?.role === "admin") {
      const { count: adminCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((adminCount ?? 0) <= 1) {
        return {
          ok: false,
          message:
            "Can't demote the only admin. Promote another user to admin first.",
        };
      }
    }
  }

  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export type DeleteUserResult =
  | { ok: true }
  | { ok: false; message: string };

export async function removeUser(userId: string): Promise<DeleteUserResult> {
  await requireAdmin();
  if (!userId) return { ok: false, message: "Missing user id." };

  // Self-delete guard
  const me = await getSessionUser();
  if (me?.id === userId) {
    return { ok: false, message: "You can't delete your own account." };
  }

  // Last-admin guard
  const supabase = await createClient();
  const { count: adminCount } = await supabase
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  const { data: thisRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (thisRole?.role === "admin" && (adminCount ?? 0) <= 1) {
    return {
      ok: false,
      message:
        "Can't delete the only admin. Promote another user to admin first.",
    };
  }

  // Delete user_roles row first (FK cascade would handle it but explicit
  // is clearer). Auth user delete auto-cascades user_roles via the
  // schema's on-delete-cascade.
  await supabase.from("user_roles").delete().eq("user_id", userId);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export type ResetPasswordResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function sendPasswordReset(
  email: string,
): Promise<ResetPasswordResult> {
  await requireAdmin();
  if (!email) return { ok: false, message: "Missing email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Reset email sent to ${email}.` };
}
