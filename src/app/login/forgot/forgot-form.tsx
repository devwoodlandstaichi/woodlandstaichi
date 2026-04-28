"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type ForgotState,
} from "../actions";
import { Button, Field, Input } from "@/components/admin/ui";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
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

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send code"}
      </Button>
    </form>
  );
}
