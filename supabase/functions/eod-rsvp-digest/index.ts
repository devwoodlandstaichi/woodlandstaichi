// EOD RSVP digest. Runs once a day via pg_cron (see migration
// 20260502000000_session_rsvps_digest_cron.sql). Pulls every pending
// session_rsvps row whose underlying session is upcoming, groups by
// recipient (admins get the full school-wide list; assigned instructors
// get just the sessions they're teaching), and posts one Resend email
// each via the Resend HTTP API. Skips entirely when the queue is empty.
//
// Required Supabase secrets:
//   - RESEND_API_KEY
//   - SUPABASE_URL                 (auto-provided)
//   - SUPABASE_SERVICE_ROLE_KEY    (auto-provided)
//   - WTC_EMAIL_FROM (optional)    fallback: "Woodlands Tai Chi <noreply@woodlandstaichi.com>"
//   - WTC_DIGEST_AUTH_TOKEN        shared secret pg_cron passes in the
//                                  Authorization header so randoms can't
//                                  trigger the function
//
// Deploy:
//   supabase functions deploy eod-rsvp-digest --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=... WTC_DIGEST_AUTH_TOKEN=...

// @ts-expect-error -- Deno globals; this file runs on Supabase Edge Runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type SessionRow = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  instructor_user_id: string | null;
  classes:
    | {
        name: string;
        location: string | null;
        day_of_week: string;
      }
    | { name: string; location: string | null; day_of_week: string }[]
    | null;
};

type RsvpRow = {
  id: string;
  class_session_id: string;
  members:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null;
};

const DAY_LABEL: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

function formatDateLabel(iso: string, day: string): string {
  // Render "Tuesday, May 5" without pulling a date library.
  const d = new Date(`${iso}T00:00:00Z`);
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const num = d.getUTCDate();
  return `${DAY_LABEL[day] ?? day}, ${month} ${num}`;
}

function formatTimeLabel(start: string, end: string): string {
  // "07:00:00" -> "7:00 AM"
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map((p) => parseInt(p, 10));
    const period = h >= 12 ? "PM" : "AM";
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${m.toString().padStart(2, "0")} ${period}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(opts: {
  to: string;
  recipientLabel: string;
  totalPending: number;
  sessions: Array<{
    sessionId: string;
    className: string;
    dayLabel: string;
    timeLabel: string;
    location: string | null;
    pendingCount: number;
    pendingNames: string[];
  }>;
  siteUrl: string;
  school: string;
}) {
  const sessionsHtml = opts.sessions
    .map((s) => {
      const shown = s.pendingNames.slice(0, 12);
      const rest = s.pendingCount - shown.length;
      const list = shown.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      const tail = rest > 0
        ? `<li style="color:#7a716a; font-style:italic;">…and ${rest} more</li>`
        : "";
      const url = `${opts.siteUrl}/admin/sessions/${s.sessionId}`;
      const loc = s.location ? ` · ${escapeHtml(s.location)}` : "";
      return `
      <div style="margin:20px 0; padding:16px 18px; background:#f6f2ec; border-radius:10px;">
        <p style="margin:0 0 4px; font-size:15px;"><strong>${escapeHtml(s.className)}</strong></p>
        <p style="margin:0 0 10px; font-size:13px; color:#7a716a;">${escapeHtml(s.dayLabel)} · ${escapeHtml(s.timeLabel)}${loc}</p>
        <p style="margin:0 0 8px; font-size:14px;"><strong>${s.pendingCount}</strong> awaiting review:</p>
        <ul style="margin:0 0 12px; padding-left:20px; font-size:14px;">${list}${tail}</ul>
        <a href="${url}" style="display:inline-block; background:#1c1815; color:#fffaf3; padding:8px 16px; text-decoration:none; border-radius:999px; font-size:13px; font-weight:500;">Open session →</a>
      </div>`;
    })
    .join("");

  const labelLine = opts.recipientLabel
    ? `<p style="margin:0 0 12px; font-size:14px; color:#7a716a;">${escapeHtml(opts.recipientLabel)}</p>`
    : "";

  const html = `
<!doctype html>
<html><body style="font-family: Georgia, 'Times New Roman', serif; color:#1c1815; line-height:1.6; max-width:560px; margin:0 auto; padding:32px 24px;">
  <h1 style="font-family: Georgia, serif; font-size:24px; font-weight:500; letter-spacing:-0.01em; margin:0 0 12px;">Today's RSVP queue.</h1>
  ${labelLine}
  <p style="font-size:15px;">${opts.totalPending} member${opts.totalPending === 1 ? " is" : "s are"} waiting on a decision before class. Quick pass below.</p>
  ${sessionsHtml}
  <p style="margin-top:20px; font-size:13px; color:#7a716a;">Sent once a day at end of day. We never email when the queue is empty.</p>
  <hr style="border:0; border-top:1px solid #e8e2dc; margin:24px 0;" />
  <p style="font-size:12px; color:#7a716a; margin:0;">${opts.school} — <a href="${opts.siteUrl}" style="color:#c84134; text-decoration:none;">woodlandstaichi.com</a></p>
</body></html>`;

  return {
    to: opts.to,
    subject: `${opts.totalPending} RSVP${opts.totalPending === 1 ? "" : "s"} awaiting review`,
    html,
  };
}

async function sendViaResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, message: `${res.status} ${text}` };
  }
  return { ok: true };
}

// @ts-expect-error -- Deno.serve global on Edge Runtime.
Deno.serve(async (req: Request) => {
  // Auth: require a shared secret in the Authorization header so this
  // function can't be triggered by anyone with the URL.
  // @ts-expect-error -- Deno.env on Edge Runtime
  const expected = Deno.env.get("WTC_DIGEST_AUTH_TOKEN");
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  // @ts-expect-error -- Deno.env
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // @ts-expect-error -- Deno.env
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  // @ts-expect-error -- Deno.env
  const resendKey = Deno.env.get("RESEND_API_KEY");
  // @ts-expect-error -- Deno.env
  const from =
    Deno.env.get("WTC_EMAIL_FROM") ||
    "Woodlands Tai Chi <noreply@woodlandstaichi.com>";
  // @ts-expect-error -- Deno.env
  const siteUrl = Deno.env.get("WTC_SITE_URL") || "https://woodlandstaichi.com";

  if (!supabaseUrl || !serviceKey)
    return new Response("missing supabase env", { status: 500 });
  if (!resendKey)
    return new Response("missing RESEND_API_KEY", { status: 500 });

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const todayIso = new Date().toISOString().slice(0, 10);

  // 1. Pull all pending RSVPs whose session is today or later.
  const { data: rsvpData, error: rsvpErr } = await sb
    .from("session_rsvps")
    .select(
      "id, class_session_id, members:member_id(first_name, last_name)",
    )
    .eq("status", "pending");
  if (rsvpErr) return new Response(rsvpErr.message, { status: 500 });
  const rsvps = (rsvpData ?? []) as RsvpRow[];

  if (rsvps.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: "empty queue" }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 2. Pull session details for the sessions referenced.
  const sessionIds = Array.from(new Set(rsvps.map((r) => r.class_session_id)));
  const { data: sessionData, error: sessionErr } = await sb
    .from("class_sessions")
    .select(
      "id, session_date, start_time, end_time, instructor_user_id, classes(name, location, day_of_week)",
    )
    .in("id", sessionIds)
    .gte("session_date", todayIso);
  if (sessionErr) return new Response(sessionErr.message, { status: 500 });
  const sessions = (sessionData ?? []) as SessionRow[];

  if (sessions.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: "all sessions in past" }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Build per-session digest entries.
  const sessionMap = new Map<string, SessionRow>();
  for (const s of sessions) sessionMap.set(s.id, s);

  type Entry = {
    sessionId: string;
    className: string;
    dayLabel: string;
    timeLabel: string;
    location: string | null;
    pendingNames: string[];
    instructorUserId: string | null;
  };
  const byEntry = new Map<string, Entry>();
  for (const r of rsvps) {
    const s = sessionMap.get(r.class_session_id);
    if (!s) continue;
    const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    if (!cls) continue;
    if (!byEntry.has(s.id)) {
      byEntry.set(s.id, {
        sessionId: s.id,
        className: cls.name,
        dayLabel: formatDateLabel(s.session_date, cls.day_of_week),
        timeLabel: formatTimeLabel(s.start_time, s.end_time),
        location: cls.location,
        pendingNames: [],
        instructorUserId: s.instructor_user_id,
      });
    }
    const m = Array.isArray(r.members) ? r.members[0] : r.members;
    if (m) {
      byEntry
        .get(s.id)!
        .pendingNames.push(`${m.first_name} ${m.last_name}`.trim());
    }
  }
  const entries = Array.from(byEntry.values()).filter(
    (e) => e.pendingNames.length > 0,
  );
  if (entries.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  // 3. Resolve recipients.
  const { data: roleRows, error: roleErr } = await sb
    .from("user_roles")
    .select("user_id, role")
    .eq("role", "admin");
  if (roleErr) return new Response(roleErr.message, { status: 500 });
  const adminUserIds = (roleRows ?? []).map(
    (r) => (r as { user_id: string }).user_id,
  );

  // Look up admin emails via auth.users (admin client only).
  const adminEmails: string[] = [];
  for (const uid of adminUserIds) {
    const { data: u } = await sb.auth.admin.getUserById(uid);
    const email = u?.user?.email ?? null;
    if (email) adminEmails.push(email);
  }

  // Instructor recipients — only the sessions they're assigned to.
  type InstructorPlan = { email: string; entries: Entry[] };
  const instructorPlans = new Map<string, InstructorPlan>();
  const uniqueInstructorIds = Array.from(
    new Set(entries.map((e) => e.instructorUserId).filter((x): x is string => !!x)),
  );
  for (const iid of uniqueInstructorIds) {
    const { data: u } = await sb.auth.admin.getUserById(iid);
    const email = u?.user?.email ?? null;
    if (!email) continue;
    instructorPlans.set(iid, {
      email,
      entries: entries.filter((e) => e.instructorUserId === iid),
    });
  }

  const totalPending = entries.reduce((n, e) => n + e.pendingNames.length, 0);
  const sentTo: string[] = [];

  // Admin email — full school-wide list.
  for (const email of adminEmails) {
    const msg = buildEmail({
      to: email,
      recipientLabel: "Across every upcoming session",
      totalPending,
      sessions: entries.map((e) => ({
        sessionId: e.sessionId,
        className: e.className,
        dayLabel: e.dayLabel,
        timeLabel: e.timeLabel,
        location: e.location,
        pendingCount: e.pendingNames.length,
        pendingNames: e.pendingNames,
      })),
      siteUrl,
      school: "Woodlands Tai Chi",
    });
    const r = await sendViaResend({ apiKey: resendKey, from, ...msg });
    if (r.ok) sentTo.push(email);
  }

  // Instructor emails — scoped to their assigned sessions.
  for (const plan of instructorPlans.values()) {
    if (adminEmails.includes(plan.email)) continue; // already covered
    const subset = plan.entries;
    if (subset.length === 0) continue;
    const subTotal = subset.reduce((n, e) => n + e.pendingNames.length, 0);
    const msg = buildEmail({
      to: plan.email,
      recipientLabel: "For sessions you're teaching",
      totalPending: subTotal,
      sessions: subset.map((e) => ({
        sessionId: e.sessionId,
        className: e.className,
        dayLabel: e.dayLabel,
        timeLabel: e.timeLabel,
        location: e.location,
        pendingCount: e.pendingNames.length,
        pendingNames: e.pendingNames,
      })),
      siteUrl,
      school: "Woodlands Tai Chi",
    });
    const r = await sendViaResend({ apiKey: resendKey, from, ...msg });
    if (r.ok) sentTo.push(plan.email);
  }

  return new Response(
    JSON.stringify({ ok: true, sent: sentTo.length, recipients: sentTo }),
    { headers: { "content-type": "application/json" } },
  );
});
