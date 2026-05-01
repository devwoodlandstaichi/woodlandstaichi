"use client";

import { useActionState, useState } from "react";
import { Field, Textarea } from "@/components/form-fields";
import { submitTestimonial, type TestimonialSubmitState } from "./actions";

export function TestimonialForm() {
  const [state, formAction, pending] = useActionState<
    TestimonialSubmitState,
    FormData
  >(submitTestimonial, undefined);

  // Re-key on each error so React 19's post-action input reset doesn't
  // wipe the user's typed values. (Same pattern as the registration form.)
  const [submitCount, setSubmitCount] = useState(0);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state && state.ok === false) setSubmitCount((c) => c + 1);
  }

  const errors = state && state.ok === false ? (state.errors ?? {}) : {};
  const banner = state && state.ok === false ? state.message : undefined;
  const submitted = state && state.ok === false ? state.values : undefined;
  const v = (key: "quote" | "attribution"): string =>
    submitted?.[key] ?? "";

  if (state?.ok === true) {
    return (
      <div
        role="status"
        className="rounded-md border border-jade/30 bg-jade/5 p-5 text-foreground/85"
      >
        <p className="font-medium text-foreground">Thank you.</p>
        <p className="mt-2 text-sm leading-relaxed">
          Your testimonial is in the queue. The founder will review it and
          publish once it&rsquo;s approved. You can close this dialog now.
        </p>
      </div>
    );
  }

  return (
    <form key={`s-${submitCount}`} action={formAction} className="space-y-5">
      {banner && (
        <div
          role="alert"
          className="rounded-md border border-vermillion bg-vermillion/5 p-4 text-vermillion"
        >
          {banner}
        </div>
      )}

      <Textarea
        name="quote"
        label="Your story"
        required
        rows={6}
        hint="What has Tai Chi been for you? Try for at least a few sentences — the most useful testimonials are specific."
        defaultValue={v("quote")}
        error={errors.quote}
      />

      <Field
        name="attribution"
        label="Short label (optional)"
        hint="e.g. “member since 2017”, “retired teacher”, or a date. Leave blank if you’d rather not."
        defaultValue={v("attribution")}
        error={errors.attribution}
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-vermillion px-6 py-3 text-sm font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Submitting…" : "Submit for review"}
        {!pending && <span aria-hidden>→</span>}
      </button>
    </form>
  );
}
