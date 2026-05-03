"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Refreshes the kiosk page when an attendance row or RSVP for this
 *  session changes, via Supabase realtime. Falls back to a slow poll
 *  every 30s in case the realtime connection drops or the channel
 *  silently dies. The combination keeps the roster panel current
 *  without the operator reloading. */
export function KioskAutoRefresh({
  sessionId,
  fallbackIntervalMs = 30000,
}: {
  sessionId?: string;
  fallbackIntervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`kiosk-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `class_session_id=eq.${sessionId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_rsvps",
          filter: `class_session_id=eq.${sessionId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, sessionId]);

  // Slow safety-net poll. If realtime drops or the channel silently
  // dies, we still pick up changes within 30s.
  useEffect(() => {
    const t = setInterval(() => router.refresh(), fallbackIntervalMs);
    return () => clearInterval(t);
  }, [router, fallbackIntervalMs]);

  return null;
}
