"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

// Tailwind-UI-style modal:
//   <div role="dialog">                                fixed z-50
//     <div backdrop>                                   fixed inset-0
//     <div container that centers panel>               fixed inset-0 + flex
//       <div panel>                                    rounded-2xl card
//
// Mobile: panel slides up from bottom (items-end + p-4).
// >= sm:  panel centers (items-center, max-w-md).
//
// Plus: ESC to close, focus first action on open, body scroll lock,
// click-outside dismisses (when not pending).

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
  tone?: "default" | "destructive";
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // ESC + scroll lock + initial focus.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Defer focus until after the panel is in the DOM.
    const t = setTimeout(() => confirmRef.current?.focus(), 30);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, pending, onOpenChange]);

  if (!open) return null;

  function close() {
    if (pending) return;
    onOpenChange(false);
  }

  const eyebrow = tone === "destructive" ? "Irreversible" : "Confirm";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="relative z-50"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 bg-foreground/40 backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        )}
        data-state="open"
        onClick={close}
      />

      {/* Centering container */}
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          {/* Panel */}
          <div
            className={cn(
              "relative w-full transform overflow-hidden rounded-2xl",
              "bg-card text-left shadow-2xl border border-foreground/10",
              "sm:my-8 sm:max-w-md",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2",
            )}
            data-state="open"
            // stop click from bubbling to backdrop
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-5 sm:px-7 sm:pt-7">
              <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-4">
                <span className="inline-block h-px w-6 align-middle bg-vermillion mr-2" />
                {eyebrow}
              </p>
              <h2
                id="confirm-title"
                className="font-display text-2xl leading-[1.15] tracking-tight"
              >
                {title}
              </h2>
              {description && (
                <div className="mt-3 text-sm leading-relaxed text-foreground/75">
                  {description}
                </div>
              )}
            </div>

            <div
              className={cn(
                "bg-secondary/40 px-6 py-4 sm:px-7",
                "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={close}
                disabled={pending}
                className="w-full sm:w-auto"
              >
                {cancelLabel}
              </Button>
              <Button
                ref={confirmRef}
                type="button"
                variant={tone === "destructive" ? "destructive" : "default"}
                onClick={() => {
                  void onConfirm();
                }}
                disabled={pending}
                className={cn(
                  "w-full sm:w-auto",
                  tone === "default" &&
                    "bg-vermillion text-background hover:bg-vermillion/90",
                )}
              >
                {pending ? "Working…" : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
