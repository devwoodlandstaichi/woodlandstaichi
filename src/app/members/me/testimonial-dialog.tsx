"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { TestimonialForm } from "./testimonial-form";

// Same modal idiom as /admin/members DangerZoneButton: a manual portal
// with click-outside / Escape / body-scroll-lock. The form lives inside
// — its inline "Thank you" success state stays visible after submit; on
// close we router.refresh() so the page re-renders without the trigger
// (the testimonial moves into "Your submissions" now).

export function TestimonialDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-vermillion px-6 py-3 text-sm font-medium text-background hover:bg-vermillion-600 transition-colors"
      >
        Share your story <span aria-hidden>→</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-dialog-title"
          className="relative z-50"
        >
          <div
            aria-hidden
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={close}
          />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div
                className="relative w-full transform overflow-hidden rounded-2xl border border-foreground/10 bg-card text-left shadow-2xl sm:my-8 sm:max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-6 pb-7 sm:px-8 sm:pt-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-muted-foreground">
                        <span className="mr-2 inline-block h-px w-6 align-middle bg-vermillion" />
                        Testimonial
                      </p>
                      <h2
                        id="story-dialog-title"
                        className="font-display text-2xl leading-tight tracking-tight"
                      >
                        Share your story
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      aria-label="Close dialog"
                      className="-m-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/55 hover:bg-foreground/5 hover:text-foreground"
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-foreground/65">
                    Members&rsquo; words mean more to newcomers than anything
                    we could write. Submissions are reviewed before they go
                    live.
                  </p>

                  <TestimonialForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
