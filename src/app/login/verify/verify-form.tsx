"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  verifyAndReset,
  type VerifyState,
} from "../actions";
import { Button, Field, Input } from "@/components/admin/ui";

export function VerifyForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(
    verifyAndReset,
    undefined,
  );
  const [showPassword, setShowPassword] = useState(false);

  const submitted = state && state.ok === false ? state.values : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="email" value={email} />

      <Field
        label="Verification code"
        htmlFor="token"
        hint="Check your email — including spam. Code expires in about an hour."
      >
        <Input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          maxLength={10}
          required
          defaultValue={submitted?.token ?? ""}
          className="font-mono tracking-[0.4em]"
        />
      </Field>

      <Field label="New password" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={12}
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden />
            ) : (
              <Eye size={18} aria-hidden />
            )}
          </button>
        </div>
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="confirm"
        hint="At least 12 characters, with upper-case, lower-case, and a digit."
      >
        <Input
          id="confirm"
          name="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          minLength={12}
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

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Verifying…" : "Set new password"}
      </Button>
    </form>
  );
}
