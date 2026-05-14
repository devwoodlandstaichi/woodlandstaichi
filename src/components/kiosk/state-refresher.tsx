"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Schedules a single page refresh at `transitionAtMs`, so the kiosk
// moves to its next state (active → closed, closed → active, etc.)
// without polling every second. If the deadline is far away, we cap
// the wait at 60s and re-arm — keeps the page responsive to clock
// drift and ensures we never sleep past a real transition by more
// than a minute.

export function KioskStateRefresher({
  transitionAtMs,
}: {
  transitionAtMs: number;
}) {
  const router = useRouter();

  useEffect(() => {
    function arm() {
      const now = Date.now();
      const delay = Math.max(0, transitionAtMs - now);
      const sleep = Math.min(delay, 60_000); // re-arm at most every minute
      const id = window.setTimeout(() => {
        if (Date.now() >= transitionAtMs) {
          router.refresh();
        } else {
          arm();
        }
      }, sleep + 250); // small buffer so we land *past* the deadline
      return id;
    }
    const id = arm();
    return () => window.clearTimeout(id);
  }, [router, transitionAtMs]);

  return null;
}
