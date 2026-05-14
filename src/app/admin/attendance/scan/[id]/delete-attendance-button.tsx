"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { deleteAttendance } from "../../actions";

// Row-level "remove this attendance" affordance — only rendered on the
// admin scan page. The kiosk pages (/scan/[id], /scan/auto) deliberately
// omit it; students may be near the device and a stray tap shouldn't be
// able to wipe their check-in.

export function DeleteAttendanceButton({
  attendanceId,
  sessionId,
  memberLabel,
}: {
  attendanceId: string;
  sessionId: string;
  memberLabel: string;
}) {
  const dialog = useConfirmDialog();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", attendanceId);
      fd.set("session_id", sessionId);
      await deleteAttendance(fd);
      dialog.close();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={dialog.show}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10"
        aria-label={`Remove ${memberLabel} from attendance`}
      >
        <Trash2 size={14} aria-hidden /> {pending ? "Removing…" : "Remove"}
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        tone="destructive"
        title={`Remove ${memberLabel}?`}
        description={
          <p>
            Take <strong>{memberLabel}</strong> off this session&rsquo;s
            attendance? They&rsquo;ll need to be re-scanned (or hand-typed)
            if you change your mind.
          </p>
        }
        confirmLabel="Remove"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
