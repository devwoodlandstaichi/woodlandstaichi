import "server-only";
import { SCHOOL_TZ } from "@/lib/format";

// Auto-rotation rules for /scan/auto:
//   - A session's check-in window is [start - KIOSK_PREOPEN_MINUTES,
//     start + KIOSK_GRACE_MINUTES]. The early opening lets members
//     scan as they arrive in the 20 minutes before class; the grace
//     period catches latecomers in the first 15 minutes.
//   - Once a session passes its close moment (start + grace), the
//     kiosk transitions: either to the next session today at the same
//     location (when its pre-open begins), or to a "closed" page with
//     a countdown to that next session, or to a "done" page if there
//     are no more sessions today.

export const KIOSK_PREOPEN_MINUTES = 20;
export const KIOSK_GRACE_MINUTES = 15;

// Legacy alias — still imported by /admin/attendance/page.tsx for its
// "is this session past?" filter, which uses the grace boundary. Kept
// as a named constant so call-sites stay readable.
export const KIOSK_CHECKIN_WINDOW_MINUTES = KIOSK_GRACE_MINUTES;

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
  | {
      kind: "active";
      session: KioskSession;
      /** Wall-clock start time. Before now, we're in the pre-open
       * phase (scanner is live but class hasn't started yet). */
      startsAtMs: number;
      /** start + KIOSK_GRACE_MINUTES — when the scanner closes for
       * this session. The page schedules its refresh to this moment. */
      closesAtMs: number;
    }
  | {
      kind: "closed";
      next: KioskSession;
      /** Wall-clock start of the next session — what we count down
       * to on the human-facing label. */
      nextStartsAtMs: number;
      /** next.start - KIOSK_PREOPEN_MINUTES — the moment the kiosk
       * flips into the active state. Page schedules its refresh here. */
      nextOpensAtMs: number;
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
  const preOpenMs = KIOSK_PREOPEN_MINUTES * 60 * 1000;
  const graceMs = KIOSK_GRACE_MINUTES * 60 * 1000;

  // Find any session whose open window contains `now`. Window is
  // [start - preOpen, start + grace]. If multiple overlap (back-to-
  // back classes can if the next pre-open begins before the previous
  // grace expires), prefer the one whose start_time is closest to now
  // — that's the session the member walking in expects to be checked
  // into.
  let active: KioskSession | null = null;
  let activeDistance = Infinity;
  for (const s of sessions) {
    const startMs = sessionStartMs(s);
    const openMs = startMs - preOpenMs;
    const closeMs = startMs + graceMs;
    if (nowMs >= openMs && nowMs <= closeMs) {
      const d = Math.abs(nowMs - startMs);
      if (d < activeDistance) {
        active = s;
        activeDistance = d;
      }
    }
  }
  if (active) {
    const startsAtMs = sessionStartMs(active);
    return {
      kind: "active",
      session: active,
      startsAtMs,
      closesAtMs: startsAtMs + graceMs,
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
    return {
      kind: "closed",
      next: nextSession,
      nextStartsAtMs,
      nextOpensAtMs: nextStartsAtMs - preOpenMs,
    };
  }

  return { kind: "done" };
}
