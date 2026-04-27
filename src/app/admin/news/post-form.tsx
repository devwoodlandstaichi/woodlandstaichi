"use client";

import { useActionState } from "react";
import {
  Button,
  Field,
  Input,
  Textarea,
} from "@/components/admin/ui";
import type { NewsFormState, NewsFormValues } from "./actions";

export type NewsDefaults = {
  title?: string;
  slug?: string | null;
  body?: string;
  posted_at?: string;
  display_order?: number;
  published?: boolean;
};

export function NewsForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: NewsFormState,
    formData: FormData,
  ) => Promise<NewsFormState>;
  defaults?: NewsDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<NewsFormState, FormData>(
    action,
    undefined,
  );
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted: Partial<NewsFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  const v = (
    key: keyof NewsFormValues,
    fallback: string | number | null | undefined = "",
  ): string => {
    if (submitted && submitted[key] !== undefined && key !== "published") {
      return String(submitted[key]);
    }
    if (fallback === null || fallback === undefined) return "";
    return String(fallback);
  };

  const publishedChecked: boolean = submitted
    ? !!submitted.published
    : defaults.published ?? true;

  const formKey = state && state.ok === false ? "errored" : "fresh";

  return (
    <form key={formKey} action={formAction} className="grid gap-5" noValidate>
      <Field label="Title" htmlFor="title" error={errors.title}>
        <Input
          id="title"
          name="title"
          required
          defaultValue={v("title", defaults.title)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Slug"
          htmlFor="slug"
          error={errors.slug}
          hint="Optional. Auto-generated from title if blank."
        >
          <Input
            id="slug"
            name="slug"
            defaultValue={v("slug", defaults.slug)}
          />
        </Field>
        <Field
          label="Posted date"
          htmlFor="posted_at"
          error={errors.posted_at}
          hint="Defaults to today."
        >
          <Input
            id="posted_at"
            name="posted_at"
            type="date"
            defaultValue={v("posted_at", defaults.posted_at)}
          />
        </Field>
      </div>

      <Field
        label="Body"
        htmlFor="body"
        error={errors.body}
        hint="Supports **bold** and [link text](url)."
      >
        <Textarea
          id="body"
          name="body"
          rows={10}
          required
          defaultValue={v("body", defaults.body)}
        />
      </Field>

      <Field
        label="Display order"
        htmlFor="display_order"
        error={errors.display_order}
        hint="Lower numbers within the same date appear first. Default 0."
      >
        <Input
          id="display_order"
          name="display_order"
          type="number"
          min={0}
          defaultValue={v("display_order", defaults.display_order ?? 0)}
        />
      </Field>

      <label className="flex items-center gap-3 pt-1 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={publishedChecked}
          className="h-5 w-5 rounded border border-input"
        />
        Published — show on /news
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
