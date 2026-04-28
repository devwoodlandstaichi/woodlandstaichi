"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { deleteClass } from "./actions";

export function DeleteClassButton({
  id,
  name,
  variant = "ghost",
  size = "sm",
}: {
  id: string;
  name: string;
  variant?: "ghost" | "outline" | "destructive";
  size?: "sm" | "default";
}) {
  const dialog = useConfirmDialog();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => {
      void deleteClass(fd);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={dialog.show}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10"
        aria-label={`Delete ${name}`}
      >
        <Trash2 size={14} aria-hidden /> {pending ? "Deleting…" : "Delete"}
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title={`Permanently delete "${name}"?`}
        description={
          <>
            <p>
              This also removes its sessions, registrations, and attendance
              records. This cannot be undone.
            </p>
            <p className="mt-2 text-foreground/60">
              If you only want it off the public schedule, use{" "}
              <strong>Archive</strong> instead.
            </p>
          </>
        }
        confirmLabel="Delete forever"
        tone="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
