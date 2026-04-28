"use client";

import { useActionState, useRef, useState } from "react";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
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
  cover_image_url?: string | null;
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

  // Cover-image preview state. We track:
  //   - localPreview: data URL of the just-picked file (replaces existing).
  //   - markedRemoved: when toggled, the existing image is hidden and the
  //     hidden remove_cover_image=1 flag is sent to the server.
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [markedRemoved, setMarkedRemoved] = useState(false);

  const showExisting =
    !!defaults.cover_image_url && !localPreview && !markedRemoved;
  const showLocalPreview = !!localPreview && !markedRemoved;

  function onPickFile(file: File | null) {
    if (!file) {
      setLocalPreview(null);
      return;
    }
    setMarkedRemoved(false);
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearPick() {
    setLocalPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <form
      key={formKey}
      action={formAction}
      encType="multipart/form-data"
      className="grid gap-5"
      noValidate
    >
      {/* Cover image */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium tracking-wide text-foreground/85">
          Cover image
        </span>

        <div className="flex items-start gap-4">
          <div className="relative flex h-28 w-44 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-foreground/20 bg-secondary/40 text-muted-foreground">
            {showLocalPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL preview
              <img
                src={localPreview!}
                alt="Selected cover preview"
                className="h-full w-full object-cover"
              />
            ) : showExisting ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL
              <img
                src={defaults.cover_image_url!}
                alt="Current cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-xs">
                <ImageIcon size={20} aria-hidden />
                No image
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent">
              <Upload size={14} aria-hidden />
              {showLocalPreview || showExisting ? "Replace" : "Upload"}
              <input
                ref={fileRef}
                type="file"
                name="cover_image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            {showLocalPreview && (
              <button
                type="button"
                onClick={clearPick}
                className="inline-flex h-9 w-fit items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel pick
              </button>
            )}

            {/* If there's an existing image and the user hasn't picked a new
                one, offer an explicit "remove" toggle. We send the literal
                "1" string in form data so the server can detect intent. */}
            {defaults.cover_image_url && !localPreview && (
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={markedRemoved}
                  onChange={(e) => setMarkedRemoved(e.target.checked)}
                  className="h-4 w-4 rounded border border-input"
                />
                <Trash2 size={12} aria-hidden /> Remove current image
              </label>
            )}
            {markedRemoved && (
              <input type="hidden" name="remove_cover_image" value="1" />
            )}

            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, or GIF · up to 5 MB.
            </p>
          </div>
        </div>
      </div>

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
