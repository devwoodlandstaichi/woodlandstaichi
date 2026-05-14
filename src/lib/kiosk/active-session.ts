import "server-only";
import { SCHOOL_TZ } from "@/lib/format";

// Auto-rotation rules for /scan/auto:
//   - A session is "active" for check-in from its start time through
//     start_time + KIOSK_CHECKIN_WINDOW_MINUTES. Admin physically starts
//     the kiosk; we don't pre-activate before start_time.
//   - Once a session passes its close moment, the kiosk transitions:
//     either to the next session today at the same location, or to a
//     "closed" page if the next one is some time away, or to a "done"
//     page if there's nothing left today.

export const KIOSK_CHECKIN_WINDOW_MINUTES = 15;

export type KioskSession = {
  id: string;
  session_date: string; // YYYY-MM-DD in school TZ
  start_time: string; // HH:MM:SS
  end_time: string;
  classes: {
    name: string;
    level: string;
    location: string;
  } | null;
};

export type KioskState =
  | { kind: "active"; session: KioskSession; closesAtMs: number }
  | {
      kind: "closed";
      next: KioskSession;
      nextStartsAtMs: number;
    }
  | { kind: "done" };

/** UTC millisecond timestamp for the school-TZ instant
 * `YYYY-MM-DD HH:MM:SS` represents. Anchors the date+time to America/
 * Chicago wall-clock and converts to a real instant. */
export function sessionStartMs(session: KioskSession): number {
  return wallClockToUtcMs(session.session_date, session.start_time);
}

function wallClockToUtcMs(dateIso: string, time: string): number {
  // We need: "2026-05-14 08:00:00 in America/Chicago" → UTC ms.
  // Intl + iteration is the cleanest approach without a TZ library.
  // Use Date.UTC as a starting guess (assumes the wall clock is UTC),
  // then correct by the offset that the *guessed* instant has in the TZ.
  const [y, m, d] = dateIso.split("-").map(Number);
  const [h, mi, s] = time.split(":").map(Number);
  const guess = Date.UTC(y, (m ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, s ?? 0);

  // Format that UTC moment in the school's TZ. The difference between
  // the formatted wall clock and the original input is the TZ offset
  // we need to subtract.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(guess));
  const tzPart = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const tzMs = Date.UTC(
    tzPart("year"),
    tzPart("month") - 1,
    tzPart("day"),
    tzPart("hour") === 24 ? 0 : tzPart("hour"),
    tzPart("minute"),
    tzPart("second"),
  );
  const offset = tzMs - guess; // how far ahead the TZ is vs UTC
  return guess - offset;
}

/** Pick the right kiosk state for `now` given today's eligible
 * sessions (already filtered to the kiosk's location, in school TZ).
 * Sessions should be ordered by start_time ascending. */
export function pickKioskState(
  sessions: KioskSession[],
  nowMs: number,
): KioskState {
  const windowMs = KIOSK_CHECKIN_WINDOW_MINUTES * 60 * 1000;

  // Find any session currently in its check-in window. If multiple
  // overlap (unusual; back-to-back classes don't because the previous
  // closes exactly when the next would start), prefer the one whose
  // start_time is closest to `now`.
  let active: KioskSession | null = null;
  let activeDistance = Infinity;
  for (const s of sessions) {
    const startMs = sessionStartMs(s);
    const closeMs = startMs + windowMs;
    if (nowMs >= startMs && nowMs <= closeMs) {
      const d = nowMs - startMs;
      if (d < activeDistance) {
        active = s;
        activeDistance = d;
      }
    }
  }
  if (active) {
    return {
      kind: "active",
      session: active,
      closesAtMs: sessionStartMs(active) + windowMs,
    };
  }

  // No session active. Find the next future session today.
  let nextSession: KioskSession | null = null;
  let nextStartsAtMs = Infinity;
  for (const s of sessions) {
    const startMs = sessionStartMs(s);
    if (startMs > nowMs && startMs < nextStartsAtMs) {
      nextSession = s;
      nextStartsAtMs = startMs;
    }
  }
  if (nextSession) {
    return { kind: "closed", next: nextSession, nextStartsAtMs };
  }

  return { kind: "done" };
}
