"use client";

import { useTransition } from "react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/admin/ui";
import { clearPinAction } from "./actions";

export function ClearPinButton() {
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const r = await clearPinAction();
      dialog.close();
      if (!r) return;
      toast({
        tone: r.ok ? "ok" : "err",
        title: r.message,
      });
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
      >
        Remove PIN
      </Button>
      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title="Remove the kiosk PIN?"
        description={
          <p>
            Once removed, anyone using the scanner can exit kiosk mode
            without entering a code. You can set a new PIN at any time.
          </p>
        }
        confirmLabel="Remove PIN"
        tone="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
