"use client";

import { useState, useTransition } from "react";
import { CalendarMinus } from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import {
  Button,
  Card,
  Field,
  Input,
} from "@/components/admin/ui";
import { deleteSessionsInRange } from "./actions";

export function BulkDeleteForm() {
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(true);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) {
      toast({
        tone: "err",
        title: "Pick a date range",
        description: "Both start and end dates are required.",
      });
      return;
    }
    dialog.show();
  }

  function onConfirm() {
    startTransition(async () => {
      const r = await deleteSessionsInRange(start, end, { onlyEmpty });
      dialog.close();
      if (r.ok) {
        toast({
          tone: r.deleted > 0 ? "ok" : "info",
          title:
            r.deleted > 0
              ? `Deleted ${r.deleted} session${r.deleted === 1 ? "" : "s"}`
              : "No sessions matched",
          description:
            r.attendanceWiped > 0
              ? `Also removed ${r.attendanceWiped} attendance scan${r.attendanceWiped === 1 ? "" : "s"}.`
              : undefined,
        });
      } else {
        toast({
          tone: "err",
          title: "Bulk delete failed",
          description: r.message,
          duration: 8000,
        });
      }
    });
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <CalendarMinus
          size={18}
          aria-hidden
          className="mt-1 shrink-0 text-destructive/80"
        />
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight">
            Bulk delete sessions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Removes every class session in the date range below.
            Admin-only. By default it skips sessions that already have
            attendance scans on them.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="bulk-start">
            <Input
              id="bulk-start"
              name="start_date"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </Field>
          <Field label="End date" htmlFor="bulk-end">
            <Input
              id="bulk-end"
              name="end_date"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={onlyEmpty}
            onChange={(e) => setOnlyEmpty(e.target.checked)}
            className="h-5 w-5 rounded border border-input"
          />
          Only delete sessions with no attendance scans yet
        </label>

        <div>
          <Button
            type="submit"
            disabled={pending}
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:border-destructive/40"
          >
            {pending ? "Deleting…" : "Delete sessions in range"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title="Delete sessions in this range?"
        description={
          <>
            <p>
              All class sessions between{" "}
              <strong className="text-foreground">{start}</strong> and{" "}
              <strong className="text-foreground">{end}</strong>
              {onlyEmpty
                ? " that have no attendance yet"
                : ""}
              {" "}
              will be permanently removed.
            </p>
            {!onlyEmpty && (
              <p className="mt-2 text-foreground/60">
                Sessions with attendance scans will be deleted along with their scans.
                This cannot be undone.
              </p>
            )}
          </>
        }
        confirmLabel="Delete sessions"
        tone="destructive"
        pending={pending}
        onConfirm={onConfirm}
      />
    </Card>
  );
}
