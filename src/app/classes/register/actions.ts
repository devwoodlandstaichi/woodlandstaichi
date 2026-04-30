"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COHORT_OPTIONS,
  registrationSchema,
  returningRegistrationSchema,
} from "./schema";

export type RegistrationState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
    }
  | { status: "success"; memberId: string };

/** Snapshot the form's posted values as plain strings so we can replay
 * them into defaultValue / defaultChecked when the form re-renders after
 * a validation error. (React 19 resets uncontrolled forms by default
 * once an action returns.) */
function snapshotValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function submitRegistration(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registrationSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      values: snapshotValues(formData),
    };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Resolve cohort label, then verify the chosen class is still an
  // active beginner class (the user may have submitted a stale form
  // after an admin archived or moved it).
  const cohortLabel =
    COHORT_OPTIONS.find((o) => o.value === data.cohort)?.label ?? data.cohort;

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,name,location,day_of_week,start_time,end_time")
    .eq("id", data.class_id)
    .eq("level", "beginners")
    .eq("active", true)
    .maybeSingle();

  if (classError || !classRow) {
    return {
      status: "error",
      message:
        "That session isn't available anymore — please reload this page and pick a current one. If you keep seeing this, email info@woodlandstaichi.com.",
      fieldErrors: { class_id: "Pick a current session." },
      values: snapshotValues(formData),
    };
  }

  const sessionLabel = classRow.name;

  // Capture waiver metadata
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent") ?? null;

  // Upsert member by email
  const { data: existingMember } = await supabase
    .from("members")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();

  const memberPayload = {
    first_name: data.first_name,
    last_name: data.last_name,
    nickname: data.nickname ?? null,
    email: data.email,
    phone: data.phone,
    street: data.street,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    birthday: data.birthday,
    sex: data.sex as "male" | "female",
    level: "beginners" as const,
    status: "waitlist" as const,
    physical_limitations: data.physical_limitations ?? null,
    prior_experience: data.prior_experience ?? null,
    found_us_via: data.found_us_via,
    expectations: data.expectations,
    emergency_contact_name: data.emergency_name,
    emergency_contact_relationship: data.emergency_relationship,
    emergency_phone: data.emergency_phone,
    waiver_signed_at: new Date().toISOString(),
    waiver_ip: ip,
    waiver_user_agent: userAgent,
  };

  let memberId: string;
  if (existingMember) {
    const { error: updateError } = await supabase
      .from("members")
      .update(memberPayload)
      .eq("id", existingMember.id);
    if (updateError) {
      return {
        status: "error",
        message:
          "We couldn't save your registration. Please try again or email info@woodlandstaichi.com.",
        values: snapshotValues(formData),
      };
    }
    memberId = existingMember.id;
  } else {
    const { data: newMember, error: insertError } = await supabase
      .from("members")
      .insert(memberPayload)
      .select("id")
      .single();
    if (insertError || !newMember) {
      return {
        status: "error",
        message:
          "We couldn't save your registration. Please try again or email info@woodlandstaichi.com.",
        values: snapshotValues(formData),
      };
    }
    memberId = newMember.id;
  }

  // Insert registration (idempotent if user re-submits same class)
  const notes = `Cohort: ${cohortLabel}. Session: ${sessionLabel}. Waiver signed by: ${data.waiver_signature}.`;
  const { error: regError } = await supabase
    .from("registrations")
    .upsert(
      {
        member_id: memberId,
        class_id: classRow.id,
        shirt_size: data.shirt_size,
        payment_method: data.payment_method as
          | "zelle"
          | "venmo"
          | "apple_pay"
          | "paypal",
        payment_status: "pending",
        notes,
      },
      { onConflict: "member_id,class_id" },
    );

  if (regError) {
    return {
      status: "error",
      message:
        "We saved your details but couldn't finish enrolling you. Please email info@woodlandstaichi.com so we can complete it.",
      values: snapshotValues(formData),
    };
  }

  redirect(`/classes/register/thanks?id=${memberId}`);
}

export async function submitReturningRegistration(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = returningRegistrationSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      values: snapshotValues(formData),
    };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Verify the chosen class is still active and is NOT a beginner class —
  // beginners must use the full new-member form.
  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,name,location,day_of_week,start_time,end_time,level")
    .eq("id", data.class_id)
    .eq("active", true)
    .neq("level", "beginners")
    .maybeSingle();

  if (classError || !classRow) {
    return {
      status: "error",
      message:
        "That class isn't available anymore — please reload this page and pick a current one. Beginners must use the new-member registration.",
      fieldErrors: { class_id: "Pick a current class." },
      values: snapshotValues(formData),
    };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent") ?? null;

  const { data: existingMember } = await supabase
    .from("members")
    .select("id,street,city,state,postal_code")
    .eq("email", data.email)
    .maybeSingle();

  // Build a member payload that only updates fields the returning form
  // actually collects. Address is overwritten only when the user provided
  // new values; otherwise we leave the on-file address alone.
  const returningPayload = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    ...(data.street !== undefined ? { street: data.street } : {}),
    ...(data.city !== undefined ? { city: data.city } : {}),
    ...(data.state !== undefined ? { state: data.state } : {}),
    ...(data.postal_code !== undefined ? { postal_code: data.postal_code } : {}),
    emergency_contact_name: data.emergency_name,
    emergency_contact_relationship: data.emergency_relationship,
    emergency_phone: data.emergency_phone,
    waiver_signed_at: new Date().toISOString(),
    waiver_ip: ip,
    waiver_user_agent: userAgent,
  };

  let memberId: string;
  if (existingMember) {
    const { error: updateError } = await supabase
      .from("members")
      .update(returningPayload)
      .eq("id", existingMember.id);
    if (updateError) {
      return {
        status: "error",
        message:
          "We couldn't save your re-registration. Please try again or email info@woodlandstaichi.com.",
        values: snapshotValues(formData),
      };
    }
    memberId = existingMember.id;
  } else {
    // Returning by email but we have no record — treat as a fresh insert
    // with whatever address they supplied (may be empty). Status starts as
    // active since they're already an experienced practitioner.
    const { data: newMember, error: insertError } = await supabase
      .from("members")
      .insert({
        ...returningPayload,
        level: "intermediate" as const,
        status: "active" as const,
      })
      .select("id")
      .single();
    if (insertError || !newMember) {
      return {
        status: "error",
        message:
          "We couldn't save your re-registration. Please try again or email info@woodlandstaichi.com.",
        values: snapshotValues(formData),
      };
    }
    memberId = newMember.id;
  }

  const noteParts = [
    `Returning player. Class: ${classRow.name}.`,
    data.status_changes ? `Status changes: ${data.status_changes}` : null,
    `Waiver signed by: ${data.waiver_signature}.`,
  ].filter((p) => p !== null);

  const { error: regError } = await supabase
    .from("registrations")
    .upsert(
      {
        member_id: memberId,
        class_id: classRow.id,
        payment_status: "paid" as const,
        notes: noteParts.join(" "),
      },
      { onConflict: "member_id,class_id" },
    );

  if (regError) {
    return {
      status: "error",
      message:
        "We saved your details but couldn't finish enrolling you. Please email info@woodlandstaichi.com so we can complete it.",
      values: snapshotValues(formData),
    };
  }

  redirect(`/classes/register/thanks?id=${memberId}&mode=returning`);
}
