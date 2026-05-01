"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import { ProfileForm, type ProfileDefaults } from "./profile-form";
import { cn } from "@/lib/utils";

export function EditDetailsDialog({
  defaults,
  variant = "chip",
  children,
  triggerClassName,
}: {
  defaults: ProfileDefaults;
  variant?: "chip" | "link";
  children?: React.ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dialog = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-details-title"
      className="fixed inset-0 z-[100]"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className={cn(
              "relative w-full overflow-hidden bg-card text-left shadow-2xl",
              "rounded-t-2xl sm:rounded-2xl",
              "border border-foreground/10",
              "sm:my-8 sm:max-w-2xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-foreground/10 px-6 pt-6 pb-5 md:px-10 md:pt-8">
              <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-foreground/55">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-vermillion" />
                Your details
              </p>
              <h2
                id="edit-details-title"
                className="font-display text-3xl leading-[1.05] tracking-tight md:text-4xl"
              >
                Edit your{" "}
                <span className="italic text-vermillion">details.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground/60">
                Name, email, and level are managed by an instructor.
                Everything else here is yours to update.
              </p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 md:px-10 md:py-8">
              <ProfileForm
                defaults={defaults}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "not-italic underline decoration-vermillion underline-offset-4 text-foreground hover:text-vermillion transition-colors",
            triggerClassName,
          )}
        >
          {children ?? "Edit details →"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-vermillion",
            triggerClassName,
          )}
        >
          <Pencil size={14} aria-hidden /> {children ?? "Edit details"}
        </button>
      )}
      {open && typeof document !== "undefined"
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
