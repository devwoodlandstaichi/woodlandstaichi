"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/admin/ui";
import type { ProductFormState, ProductFormValues } from "./actions";

export type ProductDefaults = {
  slug?: string;
  name?: string;
  tagline?: string | null;
  body?: string | null;
  note?: string | null;
  category?: string;
  price_range_label?: string | null;
  discount_label?: string | null;
  discount_url?: string | null;
  display_order?: number;
  active?: boolean;
  image_url?: string | null;
};

const CATEGORY_OPTIONS = [
  { value: "shirt", label: "Shirt" },
  { value: "jacket-ladies", label: "Jacket — Ladies" },
  { value: "jacket-mens", label: "Jacket — Men" },
  { value: "fan", label: "Fan" },
  { value: "uniform", label: "Uniform" },
  { value: "patch", label: "Patch" },
  { value: "shoes", label: "Shoes (recommendation only)" },
];

export function ProductForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  defaults?: ProductDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<
    ProductFormState,
    FormData
  >(action, undefined);
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted: Partial<ProductFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  const v = (
    key: keyof ProductFormValues,
    fallback: string | number | null | undefined = "",
  ): string => {
    if (submitted && submitted[key] !== undefined && key !== "active") {
      return String(submitted[key]);
    }
    if (fallback === null || fallback === undefined) return "";
    return String(fallback);
  };

  const activeChecked = submitted
    ? !!submitted.active
    : defaults.active ?? true;

  const formKey = state && state.ok === false ? "errored" : "fresh";

  // Photo preview state — same shape as news cover form.
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [markedRemoved, setMarkedRemoved] = useState(false);

  const showExisting =
    !!defaults.image_url && !localPreview && !markedRemoved;
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
      noValidate
      className="grid gap-6"
    >
      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Photo
        </legend>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr] items-start">
          <div className="aspect-square w-44 overflow-hidden rounded-lg border border-foreground/10 bg-secondary/40 flex items-center justify-center">
            {showExisting ? (
              <Image
                src={defaults.image_url!}
                alt=""
                width={180}
                height={180}
                className="h-full w-full object-cover"
              />
            ) : showLocalPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={localPreview!}
                alt="Selected product photo preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon
                size={28}
                aria-hidden
                className="text-muted-foreground"
              />
            )}
          </div>
          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent/10">
              <Upload size={14} aria-hidden />
              <span>Choose file</span>
              <input
                ref={fileRef}
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            {showLocalPreview && (
              <button
                type="button"
                onClick={clearPick}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 size={12} aria-hidden /> Cancel selection
              </button>
            )}
            {defaults.image_url && !localPreview && (
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={markedRemoved}
                  onChange={(e) => setMarkedRemoved(e.target.checked)}
                  className="accent-vermillion"
                />
                Remove existing photo on save
              </label>
            )}
            {markedRemoved && (
              <input type="hidden" name="remove_image" value="1" />
            )}
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP, up to 5 MB. Square photos work best.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Identity
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              name="name"
              required
              defaultValue={v("name", defaults.name)}
            />
          </Field>
          <Field label="Slug" htmlFor="slug" error={errors.slug}>
            <Input
              id="slug"
              name="slug"
              required
              placeholder="e.g. shirt"
              defaultValue={v("slug", defaults.slug)}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <Select
              id="category"
              name="category"
              defaultValue={v("category", defaults.category ?? "shirt")}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Display order"
            htmlFor="display_order"
            error={errors.display_order}
          >
            <Input
              id="display_order"
              name="display_order"
              type="number"
              min={0}
              max={9999}
              defaultValue={v("display_order", defaults.display_order ?? 0)}
            />
          </Field>
        </div>
        <Field label="Tagline" htmlFor="tagline" error={errors.tagline}>
          <Input
            id="tagline"
            name="tagline"
            placeholder='e.g. "The uniform"'
            defaultValue={v("tagline", defaults.tagline)}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Description
        </legend>
        <Field label="Body" htmlFor="body" error={errors.body}>
          <Textarea
            id="body"
            name="body"
            rows={5}
            defaultValue={v("body", defaults.body)}
          />
        </Field>
        <Field
          label="Note (italic, below the size chart)"
          htmlFor="note"
          error={errors.note}
        >
          <Input
            id="note"
            name="note"
            placeholder="e.g. Confirm your size — no exchanges."
            defaultValue={v("note", defaults.note)}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Pricing display
        </legend>
        <p className="text-sm text-muted-foreground -mt-2">
          When this product has variants below, the public site shows
          their per-size prices. The fields below are for the
          card-level label and (for shoes only) the affiliate link.
        </p>
        <Field
          label="Price range label"
          htmlFor="price_range_label"
          error={errors.price_range_label}
        >
          <Input
            id="price_range_label"
            name="price_range_label"
            placeholder='e.g. "$66 – $85" or "Included with registration"'
            defaultValue={v(
              "price_range_label",
              defaults.price_range_label,
            )}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Discount label"
            htmlFor="discount_label"
            error={errors.discount_label}
          >
            <Input
              id="discount_label"
              name="discount_label"
              placeholder="e.g. Fuego — 10% off with code …"
              defaultValue={v("discount_label", defaults.discount_label)}
            />
          </Field>
          <Field
            label="Discount URL"
            htmlFor="discount_url"
            error={errors.discount_url}
          >
            <Input
              id="discount_url"
              name="discount_url"
              type="url"
              placeholder="https://…"
              defaultValue={v("discount_url", defaults.discount_url)}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Visibility
        </legend>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={activeChecked}
            className="accent-vermillion"
          />
          <span>Show on the public store page</span>
        </label>
      </fieldset>

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
