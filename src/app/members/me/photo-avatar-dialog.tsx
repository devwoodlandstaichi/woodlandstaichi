"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Pencil, X } from "lucide-react";
import { PhotoForm } from "@/app/admin/members/photo-form";
import { type PhotoState, type PhotoVisibilityState } from "@/app/admin/members/actions";
import { CraneMark } from "@/components/crane-mark";
import { cn } from "@/lib/utils";

/** A circular profile-photo avatar that opens a dialog with the
 *  PhotoForm on click. Replaces the inline always-visible upload UI on
 *  /members/me with a tighter, image-first treatment. */
export function PhotoAvatarDialog({
  action,
  visibilityAction,
  memberName,
  photoUrl,
  photoPublic,
  description,
}: {
  action: (state: PhotoState, formData: FormData) => Promise<PhotoState>;
  visibilityAction?: (
    state: PhotoVisibilityState,
    formData: FormData,
  ) => Promise<PhotoVisibilityState>;
  memberName: string;
  photoUrl: string | null;
  photoPublic?: boolean;
  description?: string;
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
      aria-labelledby="photo-dialog-title"
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
              "sm:my-8 sm:max-w-lg",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-6 pt-6 pb-5 md:px-8 md:pt-7">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-foreground/55">
                  <span className="mr-3 inline-block h-px w-8 align-middle bg-vermillion" />
                  Your photo
                </p>
                <h2
                  id="photo-dialog-title"
                  className="font-display text-2xl leading-[1.1] tracking-tight md:text-3xl"
                >
                  Update your{" "}
                  <span className="italic text-vermillion">portrait.</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 md:px-8">
              <PhotoForm
                action={action}
                visibilityAction={visibilityAction}
                memberName={memberName}
                photoUrl={photoUrl}
                photoPublic={photoPublic}
                description={description}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={photoUrl ? "Change profile photo" : "Add a profile photo"}
        className="group relative inline-block aspect-square w-full max-w-[18rem] focus-visible:outline-none"
      >
        <span className="block aspect-square w-full overflow-hidden rounded-full ring-1 ring-foreground/10 shadow-sm transition-shadow group-hover:ring-vermillion/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-vermillion">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`Portrait of ${memberName}`}
              fill
              sizes="(min-width: 1024px) 18rem, (min-width: 768px) 33vw, 70vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-vermillion/8 via-card to-cobalt/8 p-8">
              {/* Brand-forward placeholder: tai chi figure crest in
                  vermillion (same SVG used elsewhere as a portrait
                  fallback). */}
              <CraneMark
                ariaLabel={`${memberName} — no photo uploaded`}
                className="h-full w-full text-vermillion"
              />
            </span>
          )}

          {/* Hover overlay — surfaces "Change / Upload" copy on
              interaction without intruding when at rest. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/0 text-background/0 transition-colors duration-200 group-hover:bg-foreground/35 group-hover:text-background group-focus-visible:bg-foreground/35 group-focus-visible:text-background"
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
              <Camera size={14} aria-hidden />
              {photoUrl ? "Change" : "Upload"}
            </span>
          </span>
        </span>

        {/* Persistent edit badge — a small pencil pill in the bottom-
            right corner of the circle so users know the avatar is
            editable without needing to hover. */}
        <span
          aria-hidden
          className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-vermillion text-background shadow-md transition-transform duration-200 group-hover:scale-110 md:h-10 md:w-10"
        >
          <Pencil size={14} aria-hidden />
        </span>
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(dialog, document.body)
        : null}
    </>
  );
}
