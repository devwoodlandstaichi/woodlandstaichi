// Shared types/constants between sessions/page.tsx (server) and
// sessions/filters.tsx (client). Kept directive-less so importing
// these into the server page doesn't yield a Turbopack client-
// reference wrapper whose .includes is undefined at runtime.

export type SessionPeriod = "upcoming" | "past" | "all";
export const SESSION_PERIOD_VALUES: readonly SessionPeriod[] = [
  "upcoming",
  "past",
  "all",
];
