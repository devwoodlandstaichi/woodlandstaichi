"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { Button } from "@/components/admin/ui";

/** Small "Exit kiosk" pill in the kiosk header. Confirms before
 * leaving so a stray tap doesn't drop a member back into /admin. */
export function ExitKiosk() {
  const dialog = useConfirmDialog();
  const router = useRouter();

  function leave() {
    router.push("/admin/attendance");
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={dialog.show}
        aria-label="Exit kiosk mode"
      >
        <LogOut size={14} aria-hidden /> Exit kiosk
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title="Exit kiosk mode?"
        description={
          <p>
            You&apos;ll be returned to the admin pages where the rest of the
            site is reachable.
          </p>
        }
        confirmLabel="Exit"
        onConfirm={leave}
      />
    </>
  );
}
