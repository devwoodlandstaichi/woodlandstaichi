"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

// Native <dialog> + Tailwind. Browser handles focus trap, ESC, and
// the backdrop layer for free; we paint everything else to match the
// site's editorial-quiet style.

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "default" uses the brand foreground button; "destructive" makes the
   * primary action vermillion to flag irreversibility. */
  tone?: "default" | "destructive";
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  function close() {
    if (pending) return;
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onCancel={(e) => {
        if (pending) e.preventDefault();
        else close();
      }}
      onClick={(e) => {
        // Native <dialog> sends click events for backdrop clicks with
        // target === dialog itself; the inner card swallows them.
        if (e.target === dialogRef.current) close();
      }}
      className={cn(
        "rounded-2xl border border-foreground/10 bg-card text-card-foreground shadow-2xl",
        "p-0 max-w-md w-[calc(100vw-2rem)]",
        "backdrop:bg-foreground/40 backdrop:backdrop-blur-sm",
        // Subtle pop when opening.
        "open:animate-[rise_240ms_cubic-bezier(0.2,0.6,0.2,1)]",
      )}
    >
      <div className="p-7">
        <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-4">
          <span className="inline-block h-px w-6 align-middle bg-vermillion mr-2" />
          {tone === "destructive" ? "Irreversible" : "Confirm"}
        </p>
        <h2 className="font-display text-2xl leading-[1.15] tracking-tight">
          {title}
        </h2>
        {description && (
          <div className="mt-3 text-sm leading-relaxed text-foreground/75">
            {description}
          </div>
        )}
        <div className="mt-7 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            onClick={() => {
              void onConfirm();
            }}
            disabled={pending}
            className={cn(
              tone === "default" &&
                "bg-vermillion text-background hover:bg-vermillion/90",
            )}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/** Convenience hook so call sites don't have to wire up state by hand. */
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  return {
    open,
    show: () => setOpen(true),
    close: () => setOpen(false),
    onOpenChange: setOpen,
  };
}
