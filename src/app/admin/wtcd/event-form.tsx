"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/admin/ui";
import type { WtcdFormState, WtcdFormValues } from "./actions";

export type WtcdDefaults = {
  year?: number | null;
  event_date?: string | null;
  location?: string | null;
  intro?: string | null;
  gallery_url?: string | null;
  poster_url?: string | null;
  active?: boolean;
};

export function EventForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: WtcdFormState,
    formData: FormData,
  ) => Promise<WtcdFormState>;
  defaults?: WtcdDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<WtcdFormState, FormData>(
    action,
    undefined,
  );
  const errors = state && state.ok === false ? (state.errors ?? {}) : {};
  const submitted: Partial<WtcdFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  const v = (
    key: keyof WtcdFormValues,
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
    : (defaults.active ?? true);

  // Re-key the form on every error transition so React 19 reapplies
  // defaultValue from the snapshot (see CLAUDE.md §8 — "Form actions
  // with validation errors").
  const formKey = state && state.ok === false ? "errored" : "fresh";

  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [markedRemoved, setMarkedRemoved] = useState(false);

  const showExisting =
    !!defaults.poster_url && !localPreview && !markedRemoved;
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
    <form key={formKey} action={formAction} className="grid gap-5" noValidate>
      {/* Poster */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium tracking-wide text-foreground/85">
          Poster
        </span>
        <div className="flex items-start gap-4">
          <div className="relative flex h-40 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-foreground/20 bg-secondary/40 text-muted-foreground">
            {showLocalPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL preview
              <img
                src={localPreview!}
                alt="Selected poster preview"
                className="h-full w-full object-cover"
              />
            ) : showExisting ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage / external URL
              <img
                src={defaults.poster_url!}
                alt="Current poster"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-xs">
                <ImageIcon size={20} aria-hidden />
                No poster
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
                name="poster"
                accept="image/jpeg,image/png,image/webp"
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

            {defaults.poster_url && !localPreview && (
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={markedRemoved}
                  onChange={(e) => setMarkedRemoved(e.target.checked)}
                  className="h-4 w-4 rounded border border-input"
                />
                <Trash2 size={12} aria-hidden /> Remove current poster
              </label>
            )}
            {markedRemoved && (
              <input type="hidden" name="remove_poster" value="1" />
            )}

            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP · up to 8 MB. Posters render in a
              3:4 aspect; vertical artwork looks best.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Year" htmlFor="year" error={errors.year}>
          <Input
            id="year"
            name="year"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            required
            defaultValue={v("year", defaults.year)}
          />
        </Field>
        <Field
          label="Event date"
          htmlFor="event_date"
          error={errors.event_date}
        >
          <Input
            id="event_date"
            name="event_date"
            type="date"
            required
            defaultValue={v("event_date", defaults.event_date)}
          />
        </Field>
      </div>

      <Field label="Location" htmlFor="location" error={errors.location}>
        <Input
          id="location"
          name="location"
          required
          defaultValue={v("location", defaults.location ?? "The Woodlands, TX")}
        />
      </Field>

      <Field
        label="Intro / recap (optional)"
        htmlFor="intro"
        error={errors.intro}
      >
        <Textarea
          id="intro"
          name="intro"
          rows={3}
          defaultValue={v("intro", defaults.intro)}
          placeholder="A sentence or two shown on the upcoming card. Leave blank for past years."
        />
      </Field>

      <Field
        label="Gallery link (optional)"
        htmlFor="gallery_url"
        error={errors.gallery_url}
      >
        <Input
          id="gallery_url"
          name="gallery_url"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://photos.app.goo.gl/…"
          defaultValue={v("gallery_url", defaults.gallery_url)}
        />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={activeChecked}
          className="h-4 w-4 rounded border border-input"
        />
        Active — show on the public page
      </label>

      {state && state.ok === false && state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-md px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
