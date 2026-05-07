"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Button, Field, Input } from "@/components/admin/ui";
import { generateTerm, type GenerateState } from "./actions";

import { addDaysIso, todayIsoInSchoolTz } from "@/lib/format";

function todayIso(): string {
  return todayIsoInSchoolTz();
}

function plus(weeks: number): string {
  return addDaysIso(todayIsoInSchoolTz(), weeks * 7);
}

export function GenerateTermButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<GenerateState, FormData>(
    generateTerm,
    undefined,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, pending]);

  function close() {
    if (pending) return;
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <CalendarPlus size={14} aria-hidden />
        Generate term
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gen-title"
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
                className="relative w-full transform overflow-hidden rounded-2xl border border-foreground/10 bg-card text-left shadow-2xl sm:my-8 sm:max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-6 pb-5 sm:px-7 sm:pt-7">
                  <p className="mb-4 text-xs uppercase tracking-[0.45em] text-muted-foreground">
                    <span className="mr-2 inline-block h-px w-6 align-middle bg-muted-foreground/40" />
                    Sessions
                  </p>
                  <h2
                    id="gen-title"
                    className="font-display text-2xl leading-[1.15] tracking-tight"
                  >
                    Generate term
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                    Creates a session row for every active class on every
                    matching day in the range. Safe to re-run — duplicates are
                    skipped.
                  </p>

                  <form action={action} className="mt-5 space-y-3 text-left">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Start date" htmlFor="gen-start">
                        <Input
                          id="gen-start"
                          name="start_date"
                          type="date"
                          defaultValue={todayIso()}
                          required
                        />
                      </Field>
                      <Field label="End date" htmlFor="gen-end">
                        <Input
                          id="gen-end"
                          name="end_date"
                          type="date"
                          defaultValue={plus(12)}
                          required
                        />
                      </Field>
                    </div>

                    {state && state.ok === false && (
                      <p
                        role="alert"
                        className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                      >
                        {state.message}
                      </p>
                    )}
                    {state && state.ok === true && (
                      <p
                        role="status"
                        className="rounded-md border border-jade/30 bg-[color-mix(in_oklch,var(--jade-500)_10%,transparent)] px-3 py-2 text-sm"
                      >
                        Added <strong>{state.inserted}</strong> new session
                        {state.inserted === 1 ? "" : "s"} across {state.spanned}{" "}
                        day{state.spanned === 1 ? "" : "s"}.
                      </p>
                    )}

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={close}
                        disabled={pending}
                        className="w-full sm:w-auto"
                      >
                        Close
                      </Button>
                      <Button
                        type="submit"
                        disabled={pending}
                        className="w-full sm:w-auto"
                      >
                        {pending ? "Generating…" : "Generate"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
