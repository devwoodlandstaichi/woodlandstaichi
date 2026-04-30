"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { setInitialPassword, type SetPasswordState } from "./actions";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<SetPasswordState, FormData>(
    setInitialPassword,
    undefined,
  );
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={12}
            className="block w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 pr-12 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-foreground/55 hover:text-foreground"
          >
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-foreground/55">
          At least 12 characters, with upper-case, lower-case, and a digit.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"
          minLength={12}
          className="block w-full rounded-md border border-foreground/15 bg-background px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state && state.ok === false && (
        <p
          role="alert"
          className="rounded-md border border-vermillion bg-vermillion/5 p-3 text-sm text-vermillion"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-vermillion px-6 py-3 text-sm font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Saving…" : "Save password"}
        {!pending && <span aria-hidden>→</span>}
      </button>
    </form>
  );
}
