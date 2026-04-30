"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarMinus, Trash2 } from "lucide-react";
import { Button, Field, Input } from "@/components/admin/ui";
import {
  deleteSessionsInRange,
  type BulkDeleteState,
} from "./actions";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plus(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function BulkDeleteButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState<BulkDeleteState, FormData>(
    deleteSessionsInRange,
    undefined,
  );
  const ready = confirm === "DELETE";

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
    setConfirm("");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <CalendarMinus size={14} aria-hidden />
        Bulk delete
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-del-title"
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
                  <p className="mb-4 text-xs uppercase tracking-[0.45em] text-destructive">
                    <span className="mr-2 inline-block h-px w-6 align-middle bg-destructive" />
                    Irreversible
                  </p>
                  <h2
                    id="bulk-del-title"
                    className="font-display text-2xl leading-[1.15] tracking-tight"
                  >
                    Bulk delete sessions?
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                    Removes every class session in the date range below.
                    Cascades to any attendance scans on those sessions. Cannot
                    be undone.
                  </p>

                  <form action={action} className="mt-5 space-y-3 text-left">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Start date" htmlFor="bulk-start">
                        <Input
                          id="bulk-start"
                          name="start_date"
                          type="date"
                          defaultValue={todayIso()}
                          required
                        />
                      </Field>
                      <Field label="End date" htmlFor="bulk-end">
                        <Input
                          id="bulk-end"
                          name="end_date"
                          type="date"
                          defaultValue={plus(12)}
                          required
                        />
                      </Field>
                    </div>

                    <label className="flex items-start gap-3 pt-1 text-sm">
                      <input
                        type="checkbox"
                        name="only_empty"
                        defaultChecked
                        className="mt-0.5 h-5 w-5 rounded border border-input"
                      />
                      <span>
                        Only delete sessions with no attendance scans yet
                        <span className="block text-xs text-muted-foreground">
                          Uncheck to wipe attended sessions too.
                        </span>
                      </span>
                    </label>

                    <label className="flex flex-col gap-1 pt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Type DELETE to enable
                      <Input
                        name="confirm"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono"
                      />
                    </label>

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
                        {state.deleted === 0 ? (
                          "No sessions matched."
                        ) : (
                          <>
                            Deleted {state.deleted} session
                            {state.deleted === 1 ? "" : "s"}
                            {state.attendanceWiped > 0
                              ? `; also removed ${state.attendanceWiped} attendance scan${state.attendanceWiped === 1 ? "" : "s"}.`
                              : "."}
                          </>
                        )}
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
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={!ready || pending}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 size={14} aria-hidden />
                        {pending ? "Deleting…" : "Delete sessions"}
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
