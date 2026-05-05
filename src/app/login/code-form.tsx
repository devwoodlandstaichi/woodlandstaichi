"use client";

import { useActionState } from "react";
import {
  resendCode,
  verifyCode,
  type CodeVerifyState,
  type ResendCodeState,
} from "./actions";
import { Button, Field, Input } from "@/components/admin/ui";

export function CodeForm({ email, next }: { email: string; next: string }) {
  const [verifyState, verifyAction, verifyPending] = useActionState<
    CodeVerifyState,
    FormData
  >(verifyCode, undefined);
  const [resendState, resendAction, resendPending] = useActionState<
    ResendCodeState,
    FormData
  >(resendCode, undefined);

  return (
    <div className="flex flex-col gap-5">
      <form action={verifyAction} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

        <Field label="Sign-in code" htmlFor="token">
          <Input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6,10}"
            maxLength={10}
            required
            autoFocus
            defaultValue={
              verifyState && verifyState.ok === false
                ? (verifyState.values?.token ?? "")
                : ""
            }
          />
        </Field>

        {verifyState && verifyState.ok === false && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {verifyState.message}
          </p>
        )}

        <Button type="submit" disabled={verifyPending} className="mt-2">
          {verifyPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <form action={resendAction} className="flex flex-col gap-2">
        <input type="hidden" name="email" value={email} />
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Didn&rsquo;t get it?</span>
          <button
            type="submit"
            disabled={resendPending}
            className="text-foreground underline-offset-4 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resendPending ? "Sending…" : "Resend code"}
          </button>
        </div>
        {resendState?.ok === true && (
          <p
            role="status"
            className="rounded-md border border-foreground/15 bg-secondary/40 px-3 py-2 text-xs text-foreground/75"
          >
            New code sent. Check your inbox.
          </p>
        )}
        {resendState && resendState.ok === false && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {resendState.message}
          </p>
        )}
      </form>
    </div>
  );
}
