"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COHORT_OPTIONS,
  SESSION_OPTIONS,
  SESSION_TO_CLASS_KEY,
  registrationSchema,
} from "./schema";

export type RegistrationState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; memberId: string };

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
    };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Resolve cohort label + session → class_id
  const cohortLabel =
    COHORT_OPTIONS.find((o) => o.value === data.cohort)?.label ?? data.cohort;
  const sessionLabel =
    SESSION_OPTIONS.find((o) => o.value === data.session)?.label ?? data.session;
  const classKey = SESSION_TO_CLASS_KEY[data.session];

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("level", "beginners")
    .eq("active", true)
    .eq("day_of_week", classKey.day_of_week)
    .eq("start_time", classKey.start_time)
    .maybeSingle();

  if (classError || !classRow) {
    return {
      status: "error",
      message:
        "We couldn't match your selected session to a class. Please email us at info@woodlandstaichi.com and we'll get you registered.",
    };
  }

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
    };
  }

  redirect(`/classes/register/thanks?id=${memberId}`);
}
