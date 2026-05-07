const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DAY_SHORT: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const DAY_ORDER: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
};

const LEVEL_LABELS: Record<string, string> = {
  beginners: "Beginners",
  intermediate: "Intermediate",
  advanced: "Advanced",
  remedial: "Remedial",
  play_only: "Play-only",
  combined: "Combined",
};

export const dayLabel = (d: string) => DAY_LABELS[d] ?? d;
export const dayShort = (d: string) => DAY_SHORT[d] ?? d;
export const dayOrder = (d: string) => DAY_ORDER[d] ?? 99;
export const levelLabel = (l: string) => LEVEL_LABELS[l] ?? l;

// Enum values matching the Postgres types declared in
// supabase/migrations/20260427000000_initial_schema.sql.

export const DAY_OF_WEEK_VALUES = [
  "mon", "tue", "wed", "thu", "fri", "sat", "sun",
] as const;
export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export const CLASS_LEVEL_VALUES = [
  "beginners", "intermediate", "advanced", "remedial", "play_only", "combined",
] as const;
export type ClassLevel = (typeof CLASS_LEVEL_VALUES)[number];

export const MEMBER_LEVEL_VALUES = [
  "instructor", "beginners", "intermediate", "advanced",
] as const;
export type MemberLevel = (typeof MEMBER_LEVEL_VALUES)[number];

export const MEMBER_STATUS_VALUES = ["active", "waitlist", "inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUS_VALUES)[number];

const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  waitlist: "Waitlist",
  inactive: "Inactive",
};
export const memberStatusLabel = (s: string) =>
  MEMBER_STATUS_LABELS[s as MemberStatus] ?? s;

export const CLASS_LEVEL_LABELS: Record<ClassLevel, string> = {
  beginners: "Beginners",
  intermediate: "Intermediate",
  advanced: "Advanced",
  remedial: "Remedial",
  play_only: "Play-only",
  combined: "Combined",
};

export const MEMBER_LEVEL_LABELS: Record<MemberLevel, string> = {
  instructor: "Instructor",
  beginners: "Beginners",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function formatDate(iso: string) {
  // ISO date → "Wed, Apr 29 2026"
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// =============================================================================
// School timezone helpers
//
// Class dates and "today's classes" boundaries use the school's local
// calendar (America/Chicago — Texas), not UTC. Without these helpers,
// `new Date().toISOString().slice(0,10)` would roll over to "tomorrow"
// from ~6 PM Central onward, hiding actual same-day sessions from
// admin views.
// =============================================================================

export const SCHOOL_TZ = "America/Chicago";

/** Today's date as YYYY-MM-DD in the school's timezone. */
export function todayIsoInSchoolTz(): string {
  return isoInSchoolTz(new Date());
}

/** Calendar date (YYYY-MM-DD) of an arbitrary instant in the school's
 * timezone. Uses `en-CA` locale because it formats as YYYY-MM-DD by
 * default — saves us hand-assembling the parts. */
export function isoInSchoolTz(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Add `n` calendar days to a YYYY-MM-DD string. Anchors to UTC
 * midnight to do the math, then re-extracts the date — so daylight
 * saving doesn't shift the result. Negative `n` subtracts. */
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function formatTimeRange(start: string, end: string) {
  // Postgres returns "08:00:00" — strip seconds and 12-hour format
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatTime(t: string) {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const minutes = m === 0 ? "" : `:${String(m).padStart(2, "0")}`;
  return `${h12}${minutes} ${period}`;
}
