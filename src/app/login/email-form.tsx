"use client";

import { useActionState } from "react";
import { lookupAndSendCode, type EmailLookupState } from "./actions";
import { Button, Field, Input } from "@/components/admin/ui";

export function EmailForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<EmailLookupState, FormData>(
    lookupAndSendCode,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          inputMode="email"
          autoFocus
        />
      </Field>

      {state && state.ok === false && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Sending code…" : "Send sign-in code"}
      </Button>
    </form>
  );
}
