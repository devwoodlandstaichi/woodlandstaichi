"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Input } from "@/components/admin/ui";
import { clearAllMembers, type ClearState } from "./actions";

export function DangerZoneButton({
  renderTrigger,
}: {
  renderTrigger?: (open: () => void) => React.ReactNode;
} = {}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState<ClearState, FormData>(
    clearAllMembers,
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

  const openDialog = () => setOpen(true);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openDialog)
      ) : (
        <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openDialog}
        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 size={14} aria-hidden />
        Clear all members
      </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="danger-title"
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
                    id="danger-title"
                    className="font-display text-2xl leading-[1.15] tracking-tight"
                  >
                    Clear all members?
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                    Deletes every row in the members table — and via cascade,
                    every attendance and registration record. Use this only to
                    reset after a bad data import. Cannot be undone.
                  </p>

                  <form action={action} className="mt-5 space-y-3 text-left">
                    <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Type DELETE to enable
                      <Input
                        name="confirm"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono"
                        aria-describedby="clear-help"
                      />
                    </label>
                    <p
                      id="clear-help"
                      className="text-xs text-muted-foreground"
                    >
                      After clearing, you can re-run the importer:{" "}
                      <code className="font-mono text-foreground/85">
                        python3 toImport/migrate.py
                      </code>
                      .
                    </p>

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
                        Cleared {state.deleted} member
                        {state.deleted === 1 ? "" : "s"}. Attendance and
                        registrations were cascade-deleted.
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
                        {pending ? "Clearing…" : "Clear all members"}
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
