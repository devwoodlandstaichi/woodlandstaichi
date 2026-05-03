"use client";

import { useActionState, useState } from "react";
import { Upload, X as XIcon } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/admin/ui";
import type {
  InstructorFormState,
  InstructorFormValues,
} from "./actions";

const TIER_OPTIONS = [
  { value: "founder", label: "Founder / Group Director" },
  { value: "senior", label: "Senior Instructor" },
  { value: "instructor", label: "Instructor" },
  { value: "assistant", label: "Assistant Instructor" },
] as const;

export type InstructorDefaults = {
  id?: string;
  name?: string;
  tier?: string;
  title?: string | null;
  bio?: string | null;
  display_order?: number;
  active?: boolean;
  photo_url?: string | null;
};

export function InstructorForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
  onClearPhoto,
}: {
  action: (
    state: InstructorFormState,
    formData: FormData,
  ) => Promise<InstructorFormState>;
  defaults?: InstructorDefaults;
  submitLabel: string;
  cancelHref: string;
  /** Optional: rendered as a separate <form> beside the main form for the
   * "remove current photo" action. Only shown on edit when a photo exists. */
  onClearPhoto?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<
    InstructorFormState,
    FormData
  >(action, undefined);
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted: Partial<InstructorFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  const v = (
    key: keyof InstructorFormValues,
    fallback: string | number | null | undefined = "",
  ): string => {
    if (submitted && submitted[key] !== undefined && key !== "active") {
      return String(submitted[key]);
    }
    if (fallback === null || fallback === undefined) return "";
    return String(fallback);
  };

  const activeChecked = submitted ? !!submitted.active : defaults.active ?? true;
  const formKey = state && state.ok === false ? "errored" : "fresh";

  // Local preview state for newly-picked image (before submit)
  const [preview, setPreview] = useState<string | null>(null);
  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return setPreview(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <form
      key={formKey}
      action={formAction}
      className="grid gap-5"
      noValidate
    >
      <Field label="Name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          required
          defaultValue={v("name", defaults.name)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tier" htmlFor="tier" error={errors.tier}>
          <Select
            id="tier"
            name="tier"
            defaultValue={v("tier", defaults.tier ?? "instructor")}
          >
            {TIER_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Display order"
          htmlFor="display_order"
          error={errors.display_order}
          hint="Lower numbers first within their tier."
        >
          <Input
            id="display_order"
            name="display_order"
            type="number"
            min={0}
            defaultValue={v("display_order", defaults.display_order ?? 100)}
          />
        </Field>
      </div>

      <Field
        label="Title (optional)"
        htmlFor="title"
        error={errors.title}
        hint="e.g. 'Senior Instructor', 'Assistant Instructor'. Shown under the name."
      >
        <Input
          id="title"
          name="title"
          defaultValue={v("title", defaults.title)}
        />
      </Field>

      <Field
        label="Bio (optional)"
        htmlFor="bio"
        error={errors.bio}
        hint="Their own words. Long-form is fine."
      >
        <Textarea
          id="bio"
          name="bio"
          rows={6}
          defaultValue={v("bio", defaults.bio)}
        />
      </Field>

      {/* Photo: existing thumbnail (if any) + new file picker */}
      <div className="grid gap-3">
        <p className="text-sm font-medium tracking-wide text-foreground/85">
          Photo
        </p>
        {(preview || defaults.photo_url) && (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? defaults.photo_url ?? ""}
              alt=""
              className="h-20 w-20 rounded-full object-cover border border-foreground/10"
            />
            <div className="text-xs text-muted-foreground">
              {preview ? "New photo (not yet saved)" : "Current photo"}
            </div>
            {!preview && onClearPhoto}
          </div>
        )}
        <label className="inline-flex items-center gap-2 self-start rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-foreground/5">
          <Upload size={14} aria-hidden />
          <span>Choose photo</span>
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPhotoChange}
            className="hidden"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP up to 5 MB. Square crops look best.
        </p>
      </div>

      <label className="flex items-center gap-3 pt-1 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={activeChecked}
          className="h-5 w-5 rounded border border-input"
        />
        Active — show on the public Instructors page
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

export function ClearPhotoButton({ id }: { id: string }) {
  return (
    <form action="/admin/instructors/clear-photo" method="post">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm">
        <XIcon size={14} aria-hidden /> Remove
      </Button>
    </form>
  );
}
