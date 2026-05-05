"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/dal";

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

  // Role-aware redirect — same logic as verifyCode. Without this,
  // every successful password sign-in goes to /admin (safeNext's
  // default) and bounces non-staff right back to /login?error=unauthorized.
  const session = await getSessionUser();
  const isStaff = session?.role === "admin" || session?.role === "instructor";
  if (isStaff && next.startsWith("/admin")) redirect(next);
  if (next.startsWith("/members")) redirect(next);
  redirect(isStaff ? "/admin" : "/members/me");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Password reset via email OTP
//
// Two real-world cases the form has to absorb:
//
//   A. Existing auth user (admin/instructor, or a member who signed in once
//      via OTP). resetPasswordForEmail mints a recovery OTP → verify with
//      type: "recovery" → updateUser sets the new password.
//
//   B. Member-only — exists in public.members but never in auth.users. The
//      bulk CSV import populates ~140 of these. resetPasswordForEmail
//      silently no-ops on these (anti-enumeration), no email gets sent,
//      Resend never sees a request. Detect this and fall back to
//      signInWithOtp({ shouldCreateUser: true }), which creates the auth
//      row AND emails an OTP. Verify in that case uses type: "email".
//
// /login/verify tries recovery first, email second, so the same form
// handles both. We don't tell the user which path they're on.
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

  // Look the email up in public.members. A member row with no user_id
  // means they were imported but have never signed in — resetPasswordForEmail
  // would silently no-op for them, so we bootstrap via signInWithOtp.
  // For everyone else (existing auth users, or unknown emails),
  // resetPasswordForEmail behaves correctly: sends a recovery OTP if
  // the user exists, silently no-ops otherwise.
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("members")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  const supabase = await createClient();
  if (member && !member.user_id) {
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
  } else {
    await supabase.auth.resetPasswordForEmail(email);
  }

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
  if (!/^\d{6,10}$/.test(token)) {
    return {
      ok: false,
      message: "Enter the code from your email.",
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
  // Try recovery first (existing auth user, normal reset). If that fails,
  // try email — this is the member-first-signin path where we used
  // signInWithOtp to create the auth row.
  let verifyErr = (
    await supabase.auth.verifyOtp({ email, token, type: "recovery" })
  ).error;
  if (verifyErr) {
    verifyErr = (
      await supabase.auth.verifyOtp({ email, token, type: "email" })
    ).error;
  }
  if (verifyErr) {
    return {
      ok: false,
      message: "Invalid or expired code. Request a new one.",
      values: { token },
    };
  }

  // Set the password and flag user_metadata.password_set so /members/me
  // doesn't gate them on first-time setup again.
  const { error: updateErr } = await supabase.auth.updateUser({
    password,
    data: { password_set: true },
  });
  if (updateErr) {
    return { ok: false, message: updateErr.message, values: { token } };
  }

  // Auto-link auth.users → public.members by email so /members/me works
  // on first visit. Same pattern as verifyCode above.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("members")
      .select("id, user_id")
      .eq("email", user.email)
      .maybeSingle();
    if (row && !row.user_id) {
      await admin.from("members").update({ user_id: user.id }).eq("id", row.id);
    }
  }

  // Role-aware redirect — members go to /members/me, staff to /admin.
  const session = await getSessionUser();
  const isStaff = session?.role === "admin" || session?.role === "instructor";
  redirect(isStaff ? "/admin" : "/members/me");
}

// ---------------------------------------------------------------------------
// Email-OTP sign-in
//
// Most members on our roster never set a password — they registered for a
// class via /classes/register, which writes only to public.members. To let
// them into /members/me we offer a passwordless flow:
//
//   Step 1 (lookupAndSendCode): user types email → we look it up in
//     public.members. If found, fire signInWithOtp (GoTrue mints a numeric
//     OTP, emails it via Resend SMTP, creates auth.users row if missing).
//     The custom magic_link template renders {{ .Token }} only — we
//     deliberately don't send the magic-link URL to keep the flow OTP-only
//     (avoids same-device PKCE pitfalls and cross-device confusion).
//     If not found, route to a "register for a class" CTA — we deliberately
//     leak existence here because the school is small and the UX win
//     outweighs the enumeration risk.
//   Step 2 (verifyCode): user types the OTP → verifyOtp({ type: 'email' })
//     creates the session. Then we auto-link auth.users.id to the
//     matching public.members row by email (same shape as
//     linkSelfByEmail in /members/me/actions.ts), and redirect by role.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailLookupState =
  | { ok: false; message: string }
  | undefined;

export async function lookupAndSendCode(
  _prev: EmailLookupState,
  formData: FormData,
): Promise<EmailLookupState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  // public.members has staff-only RLS; use the admin client for lookup.
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("members")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!member) {
    redirect(`/login?step=unknown&email=${encodeURIComponent(email)}`);
  }

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  const params = new URLSearchParams({ step: "code", email });
  if (next !== "/admin") params.set("next", next);
  redirect(`/login?${params.toString()}`);
}

export type CodeVerifyState =
  | { ok: false; message: string; values?: { token?: string } }
  | undefined;

export type ResendCodeState =
  | { ok: true }
  | { ok: false; message: string }
  | undefined;

/** Re-send the email OTP from the verify page without making the user
 * type their address again. Honours GoTrue's per-email rate limit
 * (default 60s between sends) — surfaces the error message if hit. */
export async function resendCode(
  _prev: ResendCodeState,
  formData: FormData,
): Promise<ResendCodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: "Missing or invalid email." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) {
    return {
      ok: false,
      message:
        error.message ||
        "Couldn't resend the code. Wait a moment and try again.",
    };
  }
  return { ok: true };
}

export async function verifyCode(
  _prev: CodeVerifyState,
  formData: FormData,
): Promise<CodeVerifyState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\s+/g, "");
  const next = safeNext(formData.get("next"));

  if (!email) {
    return { ok: false, message: "Missing email — go back to step 1." };
  }
  if (!/^\d{6,10}$/.test(token)) {
    return {
      ok: false,
      message: "Enter the code from your email.",
      values: { token },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    return {
      ok: false,
      message: "Invalid or expired code. Request a new one.",
      values: { token },
    };
  }

  // Auto-link auth.users → public.members by email so /members/me works
  // on first visit. Same pattern as linkSelfByEmail in /members/me.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("members")
      .select("id, user_id")
      .eq("email", user.email)
      .maybeSingle();
    if (row && !row.user_id) {
      await admin.from("members").update({ user_id: user.id }).eq("id", row.id);
    }
  }

  // Role-aware redirect. Staff with `next=/admin/...` go there; otherwise
  // members default to /members/me.
  const session = await getSessionUser();
  const isStaff = session?.role === "admin" || session?.role === "instructor";
  if (isStaff && next.startsWith("/admin")) redirect(next);
  if (next.startsWith("/members")) redirect(next);
  redirect(isStaff ? "/admin" : "/members/me");
}
