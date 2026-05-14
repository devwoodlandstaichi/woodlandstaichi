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
  MEMBER_LEVEL_LABELS,
  MEMBER_LEVEL_VALUES,
  MEMBER_SEX_VALUES,
  MEMBER_STATUS_VALUES,
  memberSexLabel,
  memberStatusLabel,
  type MemberLevel,
  type MemberSex,
  type MemberStatus,
} from "@/lib/format";
import type { MemberFormState, MemberFormValues } from "./actions";

export type MemberFormDefaults = {
  first_name?: string;
  last_name?: string;
  nickname?: string | null;
  email?: string;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  birthday?: string | null;
  joined_at?: string | null;
  sex?: MemberSex | null;
  level?: MemberLevel;
  status?: MemberStatus;
  physical_limitations?: string | null;
  prior_experience?: string | null;
  found_us_via?: string | null;
  expectations?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_phone?: string | null;
};

export function MemberForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (
    state: MemberFormState,
    formData: FormData,
  ) => Promise<MemberFormState>;
  defaults?: MemberFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<MemberFormState, FormData>(
    action,
    undefined,
  );
  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted: Partial<MemberFormValues> | undefined =
    state && state.ok === false ? state.values : undefined;

  const v = (
    key: keyof MemberFormValues,
    fallback: string | null | undefined = "",
  ): string => {
    if (submitted && submitted[key] !== undefined) {
      return String(submitted[key]);
    }
    if (fallback === null || fallback === undefined) return "";
    return String(fallback);
  };

  const formKey = state && state.ok === false ? "errored" : "fresh";

  return (
    <form
      key={formKey}
      action={formAction}
      className="grid gap-6"
      noValidate
    >
      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Identity
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" error={errors.first_name}>
            <Input
              id="first_name"
              name="first_name"
              required
              defaultValue={v("first_name", defaults.first_name)}
            />
          </Field>
          <Field label="Last name" htmlFor="last_name" error={errors.last_name}>
            <Input
              id="last_name"
              name="last_name"
              required
              defaultValue={v("last_name", defaults.last_name)}
            />
          </Field>
        </div>
        <Field label="Nickname" htmlFor="nickname" error={errors.nickname}>
          <Input
            id="nickname"
            name="nickname"
            defaultValue={v("nickname", defaults.nickname)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={v("email", defaults.email)}
            />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={v("phone", defaults.phone)}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Birthday" htmlFor="birthday" error={errors.birthday}>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={v("birthday", defaults.birthday)}
            />
          </Field>
          <Field label="Sex" htmlFor="sex" error={errors.sex}>
            <Select
              id="sex"
              name="sex"
              defaultValue={v("sex", defaults.sex)}
            >
              <option value="">—</option>
              {MEMBER_SEX_VALUES.map((value) => (
                <option key={value} value={value}>
                  {memberSexLabel(value)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Member since"
          htmlFor="joined_at"
          error={errors.joined_at}
          hint="When this person actually joined the school. Leave blank to fall back to the day their record was created."
        >
          <Input
            id="joined_at"
            name="joined_at"
            type="date"
            defaultValue={v("joined_at", defaults.joined_at)}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Membership
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Level" htmlFor="level" error={errors.level}>
            <Select
              id="level"
              name="level"
              defaultValue={v("level", defaults.level ?? "beginners")}
            >
              {MEMBER_LEVEL_VALUES.map((value) => (
                <option key={value} value={value}>
                  {MEMBER_LEVEL_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="status" error={errors.status}>
            <Select
              id="status"
              name="status"
              defaultValue={v("status", defaults.status ?? "waitlist")}
            >
              {MEMBER_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {memberStatusLabel(value)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Address
        </legend>
        <Field label="Street" htmlFor="street" error={errors.street}>
          <Input
            id="street"
            name="street"
            defaultValue={v("street", defaults.street)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" htmlFor="city" error={errors.city}>
            <Input
              id="city"
              name="city"
              defaultValue={v("city", defaults.city)}
            />
          </Field>
          <Field label="State" htmlFor="state" error={errors.state}>
            <Input
              id="state"
              name="state"
              defaultValue={v("state", defaults.state)}
            />
          </Field>
          <Field label="Postal" htmlFor="postal_code" error={errors.postal_code}>
            <Input
              id="postal_code"
              name="postal_code"
              defaultValue={v("postal_code", defaults.postal_code)}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Emergency contact
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Name"
            htmlFor="emergency_contact_name"
            error={errors.emergency_contact_name}
          >
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={v(
                "emergency_contact_name",
                defaults.emergency_contact_name,
              )}
            />
          </Field>
          <Field
            label="Relationship"
            htmlFor="emergency_contact_relationship"
            error={errors.emergency_contact_relationship}
          >
            <Input
              id="emergency_contact_relationship"
              name="emergency_contact_relationship"
              defaultValue={v(
                "emergency_contact_relationship",
                defaults.emergency_contact_relationship,
              )}
            />
          </Field>
        </div>
        <Field
          label="Phone"
          htmlFor="emergency_phone"
          error={errors.emergency_phone}
        >
          <Input
            id="emergency_phone"
            name="emergency_phone"
            type="tel"
            defaultValue={v("emergency_phone", defaults.emergency_phone)}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="font-display text-lg font-medium tracking-tight mb-1">
          Notes
        </legend>
        <Field
          label="Physical limitations"
          htmlFor="physical_limitations"
          error={errors.physical_limitations}
        >
          <Textarea
            id="physical_limitations"
            name="physical_limitations"
            rows={3}
            defaultValue={v(
              "physical_limitations",
              defaults.physical_limitations,
            )}
          />
        </Field>
        <Field
          label="Prior experience"
          htmlFor="prior_experience"
          error={errors.prior_experience}
        >
          <Textarea
            id="prior_experience"
            name="prior_experience"
            rows={3}
            defaultValue={v("prior_experience", defaults.prior_experience)}
          />
        </Field>
        <Field
          label="How they found us"
          htmlFor="found_us_via"
          error={errors.found_us_via}
        >
          <Textarea
            id="found_us_via"
            name="found_us_via"
            rows={2}
            defaultValue={v("found_us_via", defaults.found_us_via)}
          />
        </Field>
        <Field
          label="Their expectations"
          htmlFor="expectations"
          error={errors.expectations}
        >
          <Textarea
            id="expectations"
            name="expectations"
            rows={3}
            defaultValue={v("expectations", defaults.expectations)}
          />
        </Field>
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
