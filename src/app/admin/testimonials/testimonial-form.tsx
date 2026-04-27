"use client";

import { useActionState } from "react";
import {
  Button,
  Field,
  Input,
  Textarea,
} from "@/components/admin/ui";
import type {
  TestimonialFormState,
  TestimonialFormValues,
} from "./actions";

export type TestimonialDefaults = {
  member_name?: string;
  attribution?: string | null;
  quote?: string;
  display_order?: number;
  active?: boolean;
};

export function TestimonialForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: TestimonialFormState,
    formData: FormData,
  ) => Promise<TestimonialFormState>;
  defaults?: TestimonialDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<
    TestimonialFormState,
    FormData
  >(action, undefined);
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted: Partial<TestimonialFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  const v = (
    key: keyof TestimonialFormValues,
    fallback: string | number | null | undefined = "",
  ): string => {
    if (submitted && submitted[key] !== undefined && key !== "active") {
      return String(submitted[key]);
    }
    if (fallback === null || fallback === undefined) return "";
    return String(fallback);
  };

  const activeChecked: boolean = submitted
    ? !!submitted.active
    : defaults.active ?? true;

  const formKey = state && state.ok === false ? "errored" : "fresh";

  return (
    <form key={formKey} action={formAction} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Member name"
          htmlFor="member_name"
          error={errors.member_name}
        >
          <Input
            id="member_name"
            name="member_name"
            required
            defaultValue={v("member_name", defaults.member_name)}
          />
        </Field>
        <Field
          label="Attribution"
          htmlFor="attribution"
          error={errors.attribution}
          hint="Optional. e.g., 'member since 2017', 'retired nurse', '8/5/21'"
        >
          <Input
            id="attribution"
            name="attribution"
            defaultValue={v("attribution", defaults.attribution)}
          />
        </Field>
      </div>

      <Field label="Quote" htmlFor="quote" error={errors.quote}>
        <Textarea
          id="quote"
          name="quote"
          rows={6}
          required
          defaultValue={v("quote", defaults.quote)}
        />
      </Field>

      <Field
        label="Display order"
        htmlFor="display_order"
        error={errors.display_order}
        hint="Lower numbers appear first."
      >
        <Input
          id="display_order"
          name="display_order"
          type="number"
          min={0}
          defaultValue={v("display_order", defaults.display_order ?? 100)}
        />
      </Field>

      <label className="flex items-center gap-3 pt-1 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={activeChecked}
          className="h-5 w-5 rounded border border-input"
        />
        Active — show on the About page
      </label>

      {state && state.ok === false && state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <a
          href={cancelHref}
          className="inline-flex h-12 items-center justify-center rounded-md px-5 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
