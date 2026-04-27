"use client";

import { useActionState } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/admin/ui";
import {
  CLASS_LEVEL_LABELS,
  CLASS_LEVEL_VALUES,
  DAY_OF_WEEK_VALUES,
  dayLabel,
  type ClassLevel,
  type DayOfWeek,
} from "@/lib/format";
import type { ClassFormState, ClassFormValues } from "./actions";

// Match the columns we render — keeps the form tightly typed without
// importing the whole DB type surface.
export type ClassFormDefaults = {
  id?: string;
  name?: string;
  level?: ClassLevel;
  location?: string;
  location_address?: string | null;
  day_of_week?: DayOfWeek;
  start_time?: string; // "HH:MM:SS" or "HH:MM"
  end_time?: string;
  capacity?: number | null;
  cohort_start_date?: string | null;
  description?: string | null;
  active?: boolean;
  display_order?: number;
};

function timeForInput(t?: string) {
  if (!t) return "";
  return t.slice(0, 5); // <input type="time"> expects HH:MM
}

export function ClassForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: ClassFormState,
    formData: FormData,
  ) => Promise<ClassFormState>;
  defaults?: ClassFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<ClassFormState, FormData>(
    action,
    undefined,
  );
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted: Partial<ClassFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  // Pick what to show in each input: latest user-submitted value (after a
  // failed submit) wins, then the row's existing value (edit), then a
  // sensible blank/default.
  const v = (
    key: keyof ClassFormValues,
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

  // React reuses input DOM by position; re-key the form when a new
  // submission comes back so `defaultValue` is re-applied with fresh values.
  const formKey = state && state.ok === false ? "errored" : "fresh";

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
        <Field label="Level" htmlFor="level" error={errors.level}>
          <Select
            id="level"
            name="level"
            defaultValue={v("level", defaults.level ?? "beginners")}
          >
            {CLASS_LEVEL_VALUES.map((value) => (
              <option key={value} value={value}>
                {CLASS_LEVEL_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Day of week"
          htmlFor="day_of_week"
          error={errors.day_of_week}
        >
          <Select
            id="day_of_week"
            name="day_of_week"
            defaultValue={v("day_of_week", defaults.day_of_week ?? "wed")}
          >
            {DAY_OF_WEEK_VALUES.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Start time" htmlFor="start_time" error={errors.start_time}>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            required
            defaultValue={
              submitted?.start_time ?? timeForInput(defaults.start_time)
            }
          />
        </Field>
        <Field label="End time" htmlFor="end_time" error={errors.end_time}>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            required
            defaultValue={
              submitted?.end_time ?? timeForInput(defaults.end_time)
            }
          />
        </Field>
      </div>

      <Field label="Location" htmlFor="location" error={errors.location}>
        <Input
          id="location"
          name="location"
          required
          defaultValue={v("location", defaults.location)}
        />
      </Field>

      <Field
        label="Location address"
        htmlFor="location_address"
        error={errors.location_address}
        hint="Optional. Shown on the public schedule."
      >
        <Input
          id="location_address"
          name="location_address"
          defaultValue={v("location_address", defaults.location_address)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Capacity" htmlFor="capacity" error={errors.capacity}>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={999}
            defaultValue={v("capacity", defaults.capacity)}
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
            defaultValue={v("display_order", defaults.display_order ?? 0)}
          />
        </Field>
      </div>

      <Field
        label="Cohort start date"
        htmlFor="cohort_start_date"
        error={errors.cohort_start_date}
        hint="Optional — for limited-run beginner cohorts."
      >
        <Input
          id="cohort_start_date"
          name="cohort_start_date"
          type="date"
          defaultValue={v("cohort_start_date", defaults.cohort_start_date)}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description}>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={v("description", defaults.description)}
        />
      </Field>

      <label className="flex items-center gap-3 pt-1 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={activeChecked}
          className="h-5 w-5 rounded border border-input"
        />
        Active — show on the public schedule
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
