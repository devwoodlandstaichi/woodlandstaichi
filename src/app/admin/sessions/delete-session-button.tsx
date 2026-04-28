"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/admin/ui";
import { deleteSession } from "./actions";

export function DeleteSessionButton({
  sessionId,
  className,
  attendanceCount = 0,
}: {
  sessionId: string;
  /** Pre-formatted "Tue, Jul 8 · 8 am" line shown in the dialog */
  className: string;
  attendanceCount?: number;
}) {
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const r = await deleteSession(sessionId);
      dialog.close();
      if (r.ok) {
        toast({
          tone: "ok",
          title: "Session deleted",
          description:
            r.attendanceWiped > 0
              ? `Also removed ${r.attendanceWiped} attendance scan${r.attendanceWiped === 1 ? "" : "s"}.`
              : undefined,
        });
      } else {
        toast({
          tone: "err",
          title: "Couldn't delete session",
          description: r.message,
          duration: 8000,
        });
      }
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
        aria-label="Delete session"
        title="Delete session"
      >
        <Trash2 size={14} aria-hidden />
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title="Delete this session?"
        description={
          <>
            <p>
              <strong className="text-foreground">{className}</strong>
            </p>
            {attendanceCount > 0 && (
              <p className="mt-2 text-foreground/60">
                {attendanceCount} attendance scan
                {attendanceCount === 1 ? "" : "s"} on this session will also be
                deleted. This cannot be undone.
              </p>
            )}
          </>
        }
        confirmLabel="Delete session"
        tone="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
