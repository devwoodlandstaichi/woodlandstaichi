"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { ok: false; message: string }
  | { ok: true }
  | undefined;

function safeNext(next: FormDataEntryValue | null): string {
  if (typeof next !== "string") return "/admin";
  // Only allow redirects to internal admin/member paths to avoid open
  // redirects.
  if (next.startsWith("/admin") || next.startsWith("/members")) return next;
  return "/admin";
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: "Invalid email or password." };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Password reset via 6-digit email OTP
//
// Step 1: requestPasswordReset — calls supabase.auth.resetPasswordForEmail,
//   which emails a 6-digit token (and a magic link, which we ignore). We
//   always redirect to /login/verify so the response doesn't leak whether
//   the email exists.
//
// Step 2: verifyAndReset — verifies the OTP via verifyOtp({ type: "recovery" }),
//   which creates a recovery session, then immediately calls updateUser to
//   set the new password.
// ---------------------------------------------------------------------------

export type ForgotState =
  | { ok: false; message: string }
  | undefined;

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, message: "Enter your email." };
  }

  const supabase = await createClient();
  // Fire-and-forget — we deliberately don't surface "user not found"
  // errors to the client, to avoid revealing which emails exist.
  await supabase.auth.resetPasswordForEmail(email);

  redirect(`/login/verify?email=${encodeURIComponent(email)}`);
}

export type VerifyState =
  | {
      ok: false;
      message: string;
      values?: { token?: string };
    }
  | undefined;

const PASSWORD_RULES_MSG =
  "Password must be at least 12 characters and include upper-case, lower-case, and a digit.";

function passwordOk(p: string): boolean {
  return (
    p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)
  );
}

export async function verifyAndReset(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\s+/g, "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email) {
    return { ok: false, message: "Missing email — start over from /login/forgot." };
  }
  if (!/^\d{6}$/.test(token)) {
    return {
      ok: false,
      message: "Enter the 6-digit code from your email.",
      values: { token },
    };
  }
  if (!passwordOk(password)) {
    return { ok: false, message: PASSWORD_RULES_MSG, values: { token } };
  }
  if (password !== confirm) {
    return {
      ok: false,
      message: "Passwords don't match.",
      values: { token },
    };
  }

  const supabase = await createClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  if (verifyErr) {
    return {
      ok: false,
      message: "Invalid or expired code. Request a new one.",
      values: { token },
    };
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password });
  if (updateErr) {
    return { ok: false, message: updateErr.message, values: { token } };
  }

  redirect("/admin");
}
