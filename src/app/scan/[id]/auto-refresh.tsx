"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Polls the server every N ms by calling router.refresh() so the
 *  kiosk roster panel reflects new scans without the operator
 *  reloading. Only mounts on the kiosk route, so traffic is bounded
 *  to whoever is actively running it. */
export function KioskAutoRefresh({ intervalMs = 7000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs]);
  return null;
}
