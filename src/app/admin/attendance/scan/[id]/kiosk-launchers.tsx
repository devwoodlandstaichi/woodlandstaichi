"use client";

import { ExternalLink, Maximize2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/admin/ui";

/** Two ways to enter kiosk mode for an unattended scanner machine:
 *  - "New window" pops a sized child window pointing at /scan/<id>
 *    so the laptop can run scanner there while admin keeps the
 *    main tab elsewhere.
 *  - "Kiosk" navigates the current tab to /scan/<id>, hiding the
 *    admin sidebar entirely so members can't snoop into other pages.
 */
export function KioskLaunchers({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const url = `/scan/${sessionId}`;

  function openInNewWindow() {
    if (typeof window === "undefined") return;
    const w = Math.min(window.screen.availWidth, 1100);
    const h = Math.min(window.screen.availHeight, 820);
    const left = Math.max(0, (window.screen.availWidth - w) / 2);
    const top = Math.max(0, (window.screen.availHeight - h) / 2);
    window.open(
      url,
      "wtc-attendance-kiosk",
      `popup=yes,width=${w},height=${h},left=${left},top=${top}`,
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openInNewWindow}
        title="Open the scanner in a separate browser window"
      >
        <ExternalLink size={14} aria-hidden /> New window
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => router.push(url)}
        title="Hide the admin sidebar and run the scanner full-page"
      >
        <Maximize2 size={14} aria-hidden /> Kiosk
      </Button>
    </>
  );
}
