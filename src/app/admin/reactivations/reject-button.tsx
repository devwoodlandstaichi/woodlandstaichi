"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { rejectReactivation } from "./actions";

export function RejectButton({
  id,
  memberName,
}: {
  id: string;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // ConfirmDialog auto-focuses its Confirm button ~30ms after open. Steal
  // focus back to the textarea so a stray Space/Enter doesn't fire the
  // submit before the user has typed anything.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => noteRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const submit = useCallback(() => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("reviewer_note", note);
    startTransition(async () => {
      await rejectReactivation(fd);
      setOpen(false);
      setNote("");
    });
  }, [id, note]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!pending) setOpen(v);
    },
    [pending],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-md border border-vermillion/40 bg-background px-3 text-sm text-vermillion hover:bg-vermillion/10 hover:border-vermillion"
      >
        <X size={14} aria-hidden /> Reject…
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`Reject ${memberName}'s request?`}
        tone="destructive"
        confirmLabel="Send rejection"
        pending={pending}
        onConfirm={submit}
        description={
          <div className="space-y-3">
            <p>
              They&apos;ll get an email letting them know their reactivation
              wasn&apos;t approved. Add a note below if you want to give a
              reason — it goes into the email verbatim.
            </p>
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Optional note to include in the email…"
              disabled={pending}
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus-visible:border-vermillion focus-visible:outline-none disabled:opacity-60"
            />
          </div>
        }
      />
    </>
  );
}
