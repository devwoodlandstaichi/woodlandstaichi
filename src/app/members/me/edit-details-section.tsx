"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { ProfileForm, type ProfileDefaults } from "./profile-form";
import { cn } from "@/lib/utils";

export function EditDetailsSection({ defaults }: { defaults: ProfileDefaults }) {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="edit-details"
      aria-labelledby="edit-details-title"
      className="relative mx-auto max-w-7xl px-6 md:px-10 pb-12 scroll-mt-24"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="edit-details-body"
        className={cn(
          "group relative w-full text-left rounded-2xl border bg-card",
          "px-6 md:px-10 py-7 md:py-8 transition-colors",
          open
            ? "border-foreground/15"
            : "border-foreground/10 hover:border-foreground/20",
        )}
      >
        <div className="grid grid-cols-12 items-center gap-x-6">
          <div className="col-span-12 md:col-span-9">
            <p className="text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-3">
              <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
              Section 01
            </p>
            <h2
              id="edit-details-title"
              className="font-display text-3xl md:text-4xl tracking-tight leading-[1.05]"
            >
              Edit your{" "}
              <span className="italic text-vermillion">details.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-3 mt-5 md:mt-0 md:flex md:justify-end">
            <span
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors",
                open
                  ? "border border-foreground/15 text-foreground/70"
                  : "bg-foreground text-background group-hover:bg-vermillion",
              )}
            >
              {open ? (
                <>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className="rotate-180 transition-transform"
                  />
                  Close
                </>
              ) : (
                <>
                  <Pencil size={14} aria-hidden /> Edit details
                </>
              )}
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div
          id="edit-details-body"
          className="mt-6 rounded-2xl border border-foreground/10 bg-background p-6 md:p-10"
        >
          <p className="mb-6 text-sm text-foreground/60 leading-relaxed max-w-md">
            Name, email, and level are managed by an instructor. Everything
            else here is yours to update.
          </p>
          <ProfileForm
            defaults={defaults}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </section>
  );
}
