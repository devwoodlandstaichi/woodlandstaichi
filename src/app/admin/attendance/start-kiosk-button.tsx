"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Play } from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";

// Confirm dialog before entering kiosk mode so the founder doesn't
// accidentally lock the device out of the admin area. Once confirmed,
// navigates the current tab to /scan/auto?location=<LOCATION> — the
// PIN-gated exit on that page is the only way back.

export function StartKioskButton({
  location,
  label,
}: {
  location: string;
  label: string;
}) {
  const router = useRouter();
  const dialog = useConfirmDialog();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(() => {
      router.push(`/scan/auto?location=${encodeURIComponent(location)}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={dialog.show}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        title={`Start auto-rotating kiosk for today at ${location}`}
      >
        <Play size={14} aria-hidden /> {label}
      </button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title={`Start kiosk at ${location}?`}
        description={
          <>
            <p>
              This will lock this device into kiosk mode for today&rsquo;s
              classes at <strong>{location}</strong>. Once started, here is
              exactly what will happen:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-foreground/80">
              <li>
                <strong>Check-in opens when a class starts.</strong>{" "}
                Members can scan their QR or have their name typed in for
                the first <strong>15 minutes</strong> of class.
              </li>
              <li>
                <strong>After 15 minutes, check-in closes.</strong> The
                kiosk shows a &ldquo;Class is closed for check-in&rdquo;
                screen with a live countdown to the next class.
              </li>
              <li>
                <strong>The next class opens automatically</strong> at its
                start time. The kiosk switches over on its own — nobody
                needs to touch it.
              </li>
              <li>
                <strong>At the end of the day</strong>, the kiosk shows
                &ldquo;All check-ins for today are complete&rdquo; and
                stays there until tomorrow.
              </li>
            </ul>
            <p className="mt-3 text-foreground/60">
              To exit the kiosk before the day is over, you&rsquo;ll need
              the kiosk PIN (if one is set). Only start this on a device
              you intend to leave at <strong>{location}</strong> for the
              day.
            </p>
          </>
        }
        confirmLabel="Start kiosk"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
