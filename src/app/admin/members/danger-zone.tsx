"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Card, Input } from "@/components/admin/ui";
import { clearAllMembers, type ClearState } from "./actions";

export function DangerZone() {
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState<ClearState, FormData>(
    clearAllMembers,
    undefined,
  );

  const ready = confirm === "DELETE";

  return (
    <Card className="mt-10 border-destructive/40 p-5">
      <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-destructive">
        Danger zone
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong>Clear all members.</strong> Deletes every row in the members
        table — and via cascade, every attendance and registration record.
        Use this only to reset after a bad data import. Cannot be undone.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Type DELETE to enable
          <Input
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="w-48 font-mono"
            aria-describedby="clear-help"
          />
        </label>
        <Button
          type="submit"
          variant="destructive"
          disabled={!ready || pending}
        >
          <Trash2 size={14} aria-hidden />
          {pending ? "Clearing…" : "Clear all members"}
        </Button>
      </form>

      <p id="clear-help" className="mt-3 text-xs text-muted-foreground">
        After clearing, you can re-run the importer:{" "}
        <code className="font-mono text-foreground/85">
          python3 toImport/migrate.py
        </code>{" "}
        and apply{" "}
        <code className="font-mono text-foreground/85">
          toImport/migration.sql
        </code>
        .
      </p>

      {state && state.ok === false && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}
      {state && state.ok === true && (
        <p
          role="status"
          className="mt-4 rounded-md border border-jade/30 bg-[color-mix(in_oklch,var(--jade-500)_10%,transparent)] px-3 py-2 text-sm"
        >
          Cleared {state.deleted} member{state.deleted === 1 ? "" : "s"}.
          Attendance and registrations were cascade-deleted.
        </p>
      )}
    </Card>
  );
}
