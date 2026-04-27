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
