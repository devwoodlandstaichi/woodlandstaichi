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
              sessions at <strong>{location}</strong>. The scanner will
              auto-rotate between sessions as they open and close.
            </p>
            <p className="mt-2 text-foreground/60">
              Exit requires the kiosk PIN if one is set. Start only on a
              device you intend to leave at this location for the day.
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
