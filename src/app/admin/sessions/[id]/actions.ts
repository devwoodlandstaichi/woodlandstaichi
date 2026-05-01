"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/dal";
import { sendEmail } from "@/lib/email/send";
import {
  sessionApprovalRoster,
  sessionRejectionRoster,
} from "@/lib/email/session-rsvp";
import {
  formatDate,
  formatTimeRange,
  type DayOfWeek,
} from "@/lib/format";

type RsvpStatus =
  | "pending"
  | "approved"
  | "waitlisted"
  | "rejected"
  | "cancelled";

const DAY_LABEL: Record<DayOfWeek, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

async function setRsvpStatus(
  rsvpId: string,
  next: RsvpStatus,
  reviewerId: string,
  note?: string | null,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("session_rsvps")
    .update({
      status: next,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: reviewerId,
      reviewer_note: note ?? null,
    })
    .eq("id", rsvpId);
  return error;
}

export async function approveRsvp(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  if (!id || !sessionId) return;
  // Trigger session_rsvps_capacity_guard rejects this if it would
  // overbook. UI also disables the button at capacity, but the DB is
  // the source of truth.
  await setRsvpStatus(id, "approved", reviewer.id);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function rejectRsvp(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  const note = String(formData.get("reviewer_note") ?? "").trim() || null;
  if (!id || !sessionId) return;
  await setRsvpStatus(id, "rejected", reviewer.id, note);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function waitlistRsvp(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  if (!id || !sessionId) return;
  await setRsvpStatus(id, "waitlisted", reviewer.id);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function restoreRsvpToPending(formData: FormData) {
  const reviewer = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "");
  if (!id || !sessionId) return;
  await setRsvpStatus(id, "pending", reviewer.id, null);
  revalidatePath(`/admin/sessions/${sessionId}`);
}

// ---------------------------------------------------------------------
// Roster emails — admin-triggered. We send one Resend message per
// session per status batch; recipients land in BCC so they don't see
// each other's addresses. Each rsvp.notified_at is stamped so a future
// resend only includes newly-decided rows.
// ---------------------------------------------------------------------

// Sent feedback shows up in the page header timestamps + counter
// after revalidation. Errors are swallowed for now (we'll surface
// them through useActionState when we add a client wrapper).

async function loadSessionContext(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_sessions")
    .select(
      "id, session_date, start_time, end_time, classes(name, location, day_of_week, level)",
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  const cls = Array.isArray(data.classes) ? data.classes[0] : data.classes;
  if (!cls) return null;
  return {
    id: data.id as string,
    session_date: data.session_date as string,
    start_time: data.start_time as string,
    end_time: data.end_time as string,
    class_name: cls.name as string,
    class_location: (cls.location as string | null) ?? null,
    day_of_week: cls.day_of_week as DayOfWeek,
  };
}

function dateLabelFor(dateIso: string, day: DayOfWeek) {
  return `${DAY_LABEL[day]}, ${formatDate(dateIso)}`;
}

export async function sendApprovalRoster(formData: FormData): Promise<void> {
  const reviewer = await requireStaff();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;

  const ctx = await loadSessionContext(sessionId);
  if (!ctx) return;

  const supabase = await createClient();
  // Pull approved RSVPs that haven't been notified yet — they're the
  // BCC list. We also surface the *full* approved roster (notified or
  // not) inside the email body as the participant list.
  const [unsentRes, allApprovedRes] = await Promise.all([
    supabase
      .from("session_rsvps")
      .select("id, members:member_id(first_name, last_name, email)")
      .eq("class_session_id", sessionId)
      .eq("status", "approved")
      .is("notified_at", null),
    supabase
      .from("session_rsvps")
      .select("members:member_id(first_name, last_name)")
      .eq("class_session_id", sessionId)
      .eq("status", "approved"),
  ]);

  type Row = {
    id: string;
    members: {
      first_name: string;
      last_name: string;
      email: string;
    } | { first_name: string; last_name: string; email: string }[] | null;
  };
  const unsent = (unsentRes.data ?? []) as Row[];
  if (unsent.length === 0) return;

  const recipientEmails: string[] = [];
  const unsentIds: string[] = [];
  for (const r of unsent) {
    const m = Array.isArray(r.members) ? r.members[0] : r.members;
    if (!m?.email) continue;
    recipientEmails.push(m.email);
    unsentIds.push(r.id);
  }
  if (recipientEmails.length === 0) return;

  const allRows = (allApprovedRes.data ?? []) as Row[];
  const participantNames = allRows
    .map((r) => {
      const m = Array.isArray(r.members) ? r.members[0] : r.members;
      return m ? `${m.first_name} ${m.last_name}`.trim() : null;
    })
    .filter((s): s is string => !!s)
    .sort((a, b) => a.localeCompare(b));

  const sendRes = await sendEmail(
    sessionApprovalRoster({
      session: {
        className: ctx.class_name,
        location: ctx.class_location,
        dateLabel: dateLabelFor(ctx.session_date, ctx.day_of_week),
        timeLabel: formatTimeRange(ctx.start_time, ctx.end_time),
      },
      participantNames,
      recipientEmails,
    }),
  );
  if (!sendRes.ok) return;

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("session_rsvps")
    .update({ notified_at: now })
    .in("id", unsentIds);
  await admin
    .from("class_sessions")
    .update({ approvals_sent_at: now, approvals_sent_by_user_id: reviewer.id })
    .eq("id", sessionId);

  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function sendRejectionRoster(formData: FormData): Promise<void> {
  const reviewer = await requireStaff();
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) return;

  const ctx = await loadSessionContext(sessionId);
  if (!ctx) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("session_rsvps")
    .select("id, members:member_id(email)")
    .eq("class_session_id", sessionId)
    .eq("status", "rejected")
    .is("notified_at", null);

  type Row = {
    id: string;
    members: { email: string } | { email: string }[] | null;
  };
  const rows = (data ?? []) as Row[];

  const recipientEmails: string[] = [];
  const ids: string[] = [];
  for (const r of rows) {
    const m = Array.isArray(r.members) ? r.members[0] : r.members;
    if (!m?.email) continue;
    recipientEmails.push(m.email);
    ids.push(r.id);
  }
  if (recipientEmails.length === 0) return;

  const sendRes = await sendEmail(
    sessionRejectionRoster({
      session: {
        className: ctx.class_name,
        location: ctx.class_location,
        dateLabel: dateLabelFor(ctx.session_date, ctx.day_of_week),
        timeLabel: formatTimeRange(ctx.start_time, ctx.end_time),
      },
      recipientEmails,
    }),
  );
  if (!sendRes.ok) return;

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("session_rsvps")
    .update({ notified_at: now })
    .in("id", ids);
  await admin
    .from("class_sessions")
    .update({
      rejections_sent_at: now,
      rejections_sent_by_user_id: reviewer.id,
    })
    .eq("id", sessionId);

  revalidatePath(`/admin/sessions/${sessionId}`);
}
