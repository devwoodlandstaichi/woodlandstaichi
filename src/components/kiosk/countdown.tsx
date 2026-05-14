"use client";

import { useSyncExternalStore } from "react";

// Generic live-ticking countdown. Renders the time remaining until
// `deadlineMs`. Format adapts: "2h 14m" for far-away, "0:14:32" for
// the last 15 minutes, expired-label when the deadline passes.
//
// useSyncExternalStore handles the SSR/hydration story cleanly: the
// server snapshot returns null (so output is empty), the client
// snapshot returns Date.now() and ticks once a second. No setState-
// in-effect lint complaint either.

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}
function getSnapshot() {
  return Date.now();
}
function getServerSnapshot(): number | null {
  return null;
}

export function Countdown({
  deadlineMs,
  expiredLabel = "Closing…",
  tone = "neutral",
}: {
  deadlineMs: number;
  expiredLabel?: string;
  tone?: "neutral" | "warning";
}) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (now === null) {
    return null;
  }

  const remaining = Math.max(0, deadlineMs - now);
  if (remaining === 0) {
    return <span>{expiredLabel}</span>;
  }

  const totalSec = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const granular = totalSec < 15 * 60;
  const display = granular
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

  const className =
    tone === "warning" && granular ? "text-vermillion" : undefined;

  return (
    <span className={className}>{display}</span>
  );
}
