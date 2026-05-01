import "server-only";

// Minimal RFC 5545 calendar-event generator. Produces a single VEVENT
// inside a VCALENDAR with a VTIMEZONE block for America/Chicago — the
// school's local time and the only zone class times are stored in.
// Sessions in the DB use `time without time zone` (already local), so
// we emit DTSTART/DTEND with TZID=America/Chicago and let calendar
// clients resolve the UTC instant via the embedded VTIMEZONE.

const TZID = "America/Chicago";

const VTIMEZONE_BLOCK = `BEGIN:VTIMEZONE
TZID:${TZID}
X-LIC-LOCATION:${TZID}
BEGIN:STANDARD
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZNAME:CST
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZNAME:CDT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
END:DAYLIGHT
END:VTIMEZONE`;

function localDt(dateIso: string, timeStr: string): string {
  // dateIso: YYYY-MM-DD, timeStr: HH:MM[:SS]
  const ymd = dateIso.replace(/-/g, "");
  const hms = `${timeStr}:00`.replace(/:/g, "").slice(0, 6);
  return `${ymd}T${hms}`;
}

function utcDtNow(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+/, "");
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildSessionIcs(opts: {
  uid: string;            // unique per session — class_session_id is fine
  title: string;          // event SUMMARY
  description?: string;
  location?: string | null;
  sessionDate: string;    // YYYY-MM-DD
  startTime: string;      // HH:MM[:SS] local Texas time
  endTime: string;        // HH:MM[:SS] local Texas time
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Woodlands Tai Chi//RSVP//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_BLOCK,
    "BEGIN:VEVENT",
    `UID:${opts.uid}@woodlandstaichi.com`,
    `DTSTAMP:${utcDtNow()}`,
    `DTSTART;TZID=${TZID}:${localDt(opts.sessionDate, opts.startTime)}`,
    `DTEND;TZID=${TZID}:${localDt(opts.sessionDate, opts.endTime)}`,
    `SUMMARY:${escapeIcs(opts.title)}`,
    opts.description ? `DESCRIPTION:${escapeIcs(opts.description)}` : null,
    opts.location ? `LOCATION:${escapeIcs(opts.location)}` : null,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);

  return lines.join("\r\n");
}
