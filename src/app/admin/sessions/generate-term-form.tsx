"use client";

import { useActionState } from "react";
import {
  Button,
  Card,
  Field,
  Input,
} from "@/components/admin/ui";
import { generateTerm, type GenerateState } from "./actions";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plus(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function GenerateTermForm() {
  const [state, action, pending] = useActionState<GenerateState, FormData>(
    generateTerm,
    undefined,
  );

  return (
    <Card className="p-6">
      <h2 className="font-display text-xl font-medium tracking-tight">
        Generate term
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Creates a session row for every active class on every matching day in
        the range. Safe to re-run — duplicates are skipped.
      </p>

      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Start date" htmlFor="start_date">
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={todayIso()}
          />
        </Field>
        <Field label="End date" htmlFor="end_date">
          <Input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={plus(12)}
            aria-describedby="end-date-hint"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Generating…" : "Generate"}
          </Button>
        </div>
      </form>

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
          Added <strong>{state.inserted}</strong> new session
          {state.inserted === 1 ? "" : "s"} across {state.spanned} day
          {state.spanned === 1 ? "" : "s"}.
        </p>
      )}
    </Card>
  );
}
