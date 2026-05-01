"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field } from "@/components/form-fields";
import {
  submitReactivationRequest,
  type ReactivationState,
} from "./actions";

const INITIAL: ReactivationState = { status: "idle" };

export function ReturningRegistrationForm() {
  const [state, formAction, pending] = useActionState(
    submitReactivationRequest,
    INITIAL,
  );

  const errors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const submittedEmail =
    state.status === "error"
      ? (state.values?.email ?? "")
      : "";

  // Inline branches — "not found" and "duplicate request" are not
  // form-validation errors but legitimate states that need their own
  // messaging.
  if (state.status === "not_found") {
    return (
      <div className="space-y-6">
        <div
          role="alert"
          className="rounded-md border border-vermillion/30 bg-vermillion/5 p-5"
        >
          <p className="font-medium text-foreground">
            We don&rsquo;t see{" "}
            <span className="text-vermillion">{state.email}</span> on our
            roster.
          </p>
          <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
            That email isn&rsquo;t in our records. If you registered before,
            it may have been with a different address — try another below.
            Or, if it&rsquo;s your first time joining the school, please
            register through the new-beginner form instead.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/classes/register"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-vermillion px-6 py-3 text-sm font-medium text-background hover:bg-vermillion-600 transition-colors"
          >
            Register as a new beginner →
          </Link>
          <Link
            href="/classes/register?mode=returning"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 px-5 py-3 text-sm text-foreground/75 hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Try a different email
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "duplicate") {
    return (
      <div
        role="status"
        className="rounded-md border border-jade/30 bg-jade/5 p-5 text-foreground/85"
      >
        <p className="font-medium text-foreground">
          You&rsquo;ve already got a request in the queue.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          The founder will email you about{" "}
          <span className="font-medium">{state.email}</span> shortly. No need
          to submit again.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <p className="text-base text-foreground/75 leading-relaxed">
        Type the email you used when you last attended. We&rsquo;ll forward
        your request to the founder, who&rsquo;ll review and email you back
        once you&rsquo;re reactivated.
      </p>

      <Field
        name="email"
        label="Email"
        type="email"
        required
        inputMode="email"
        autoComplete="email"
        defaultValue={submittedEmail}
        error={errors.email}
      />

      {state.status === "error" && !errors.email && (
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
        className="inline-flex items-center justify-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Submitting…" : "Request reactivation"}
        {!pending && <span aria-hidden>→</span>}
      </button>

      <p className="text-xs text-foreground/55">
        We&rsquo;ll email you the moment a decision is made.
      </p>
    </form>
  );
}
