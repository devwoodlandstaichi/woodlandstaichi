"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  adminReactivationNotice,
  memberRequestAck,
} from "@/lib/email/reactivation";
import {
  adminRegistrationNotice,
  memberRegistrationAck,
} from "@/lib/email/registration";
import {
  reactivationRequestSchema,
  registrationSchema,
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

  // Verify the chosen session is still upcoming, still flagged
  // newcomer-friendly, and still belongs to an active class. Guards
  // against a stale form pointing at a session that staff archived,
  // unflagged, or that's now in the past.
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: sessionRow, error: sessionError } = await supabase
    .from("class_sessions")
    .select(
      "id,session_date,start_time,end_time,newcomer_friendly,classes!inner(id,name,location,active)",
    )
    .eq("id", data.session_id)
    .eq("newcomer_friendly", true)
    .gte("session_date", todayIso)
    .maybeSingle();

  type SessionRow = {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    newcomer_friendly: boolean;
    classes: { id: string; name: string; location: string; active: boolean } | null;
  };
  const session = (sessionRow ?? null) as SessionRow | null;

  if (sessionError || !session || !session.classes || !session.classes.active) {
    return {
      status: "error",
      message:
        "That session isn't available anymore — please reload this page and pick a current one. If you keep seeing this, email info@woodlandstaichi.com.",
      fieldErrors: { session_id: "Pick a current session." },
      values: snapshotValues(formData),
    };
  }

  const sessionLabel = `${session.classes.name} on ${session.session_date}`;
  const classRow = { id: session.classes.id };

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
  const notes = `Session: ${sessionLabel}. Waiver signed by: ${data.waiver_signature}.`;
  const { data: regRow, error: regError } = await supabase
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
    )
    .select("id")
    .single();

  if (regError || !regRow) {
    return {
      status: "error",
      message:
        "We saved your details but couldn't finish enrolling you. Please email info@woodlandstaichi.com so we can complete it.",
      values: snapshotValues(formData),
    };
  }

  // Best-effort confirmation emails — don't block registration on
  // delivery failure. Admin notice keeps the founder in the loop;
  // member ack closes the "did my form go through?" loop.
  const memberName = data.nickname
    ? `${data.first_name} (${data.nickname})`
    : data.first_name;
  const ack = memberRegistrationAck({
    memberName,
    memberEmail: data.email,
    classLabel: sessionLabel,
    paymentMethod: data.payment_method,
  });
  const adminNotice = adminRegistrationNotice({
    memberName: `${data.first_name} ${data.last_name}`,
    memberEmail: data.email,
    classLabel: sessionLabel,
    paymentMethod: data.payment_method,
    shirtSize: data.shirt_size,
    registrationId: regRow.id,
  });
  await Promise.all([sendEmail(ack), sendEmail(adminNotice)]).catch(() => {});

  redirect(`/classes/register/thanks?id=${memberId}`);
}

// ---------------------------------------------------------------------------
// Returning-player reactivation request.
//
// Flow: member types only their email → we look it up in public.members.
//   - Found: insert a member_reactivation_requests row, fire an admin
//     notification email + a member acknowledgement email. Server
//     redirects to /classes/register/thanks?mode=returning.
//   - Not found: return a state telling the form to render a "we don't
//     see you" message with a link to the new-beginner registration.
// Approval/rejection happens at /admin/reactivations and triggers
// follow-up emails to the member.
// ---------------------------------------------------------------------------

export type ReactivationState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, string>;
    }
  | { status: "not_found"; email: string }
  | { status: "duplicate"; email: string };

export async function submitReactivationRequest(
  _prev: ReactivationState,
  formData: FormData,
): Promise<ReactivationState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = reactivationRequestSchema.safeParse(raw);
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

  const email = parsed.data.email.trim().toLowerCase();
  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, first_name, last_name, email, status")
    .eq("email", email)
    .maybeSingle();

  if (!member) {
    return { status: "not_found", email };
  }

  // Don't queue a second pending request if one's already open — one
  // approval at a time keeps the queue honest. Still send the ack
  // email so the member knows their request landed.
  const { data: open } = await supabase
    .from("member_reactivation_requests")
    .select("id")
    .eq("member_id", member.id)
    .eq("status", "pending")
    .maybeSingle();

  if (open) {
    return { status: "duplicate", email };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    null;
  const userAgent = headerStore.get("user-agent") ?? null;

  const { data: created, error: insertErr } = await supabase
    .from("member_reactivation_requests")
    .insert({
      member_id: member.id,
      email: member.email,
      request_ip: ip,
      request_user_agent: userAgent,
    })
    .select("id")
    .single();

  if (insertErr || !created) {
    return {
      status: "error",
      message:
        "We couldn't record your request. Please try again or email info@woodlandstaichi.com.",
      values: snapshotValues(formData),
    };
  }

  const memberName = `${member.first_name} ${member.last_name}`.trim();
  // Fire-and-forget email sends. Failures are logged server-side but
  // don't block the user's redirect — the request row is the source
  // of truth.
  await Promise.allSettled([
    sendEmail(
      adminReactivationNotice({
        memberName,
        memberEmail: member.email,
        requestId: created.id,
      }),
    ),
    sendEmail(memberRequestAck({ memberName, memberEmail: member.email })),
  ]);

  redirect(`/classes/register/thanks?mode=returning&id=${created.id}`);
}
