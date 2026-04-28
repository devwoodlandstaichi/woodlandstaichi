"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Field, Textarea } from "@/components/form-fields";
import { updateProfile, type ProfileFormState } from "./actions";

export type ProfileDefaults = {
  nickname: string | null;
  phone: string;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  bio: string | null;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfile, undefined);

  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const submitted = state && state.ok === false ? state.values : undefined;
  const banner = state && state.ok === false ? state.message : undefined;
  const v = (
    key: keyof NonNullable<typeof submitted>,
    fallback: string | null,
  ): string => {
    if (submitted && submitted[key] !== undefined)
      return String(submitted[key] ?? "");
    return fallback ?? "";
  };

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {state && state.ok === true && (
        <p className="rounded-md border border-jade/30 bg-jade/5 px-3 py-2 text-sm text-jade">
          Profile saved. Thanks!
        </p>
      )}
      {banner && (
        <p
          role="alert"
          className="rounded-md border border-vermillion/30 bg-vermillion/5 px-3 py-2 text-sm text-vermillion"
        >
          {banner}
        </p>
      )}

      <Field
        name="nickname"
        label="Nickname"
        hint="What you'd like instructors and classmates to call you."
        defaultValue={v("nickname", defaults.nickname)}
        error={errors.nickname}
      />

      <Field
        name="phone"
        label="Cell phone"
        type="tel"
        required
        inputMode="tel"
        autoComplete="tel"
        placeholder="(000) 000-0000"
        defaultValue={v("phone", defaults.phone)}
        error={errors.phone}
      />

      <Field
        name="street"
        label="Street"
        autoComplete="address-line1"
        defaultValue={v("street", defaults.street)}
        error={errors.street}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          name="city"
          label="City"
          autoComplete="address-level2"
          defaultValue={v("city", defaults.city)}
          error={errors.city}
        />
        <Field
          name="state"
          label="State"
          autoComplete="address-level1"
          defaultValue={v("state", defaults.state)}
          error={errors.state}
        />
        <Field
          name="postal_code"
          label="ZIP"
          inputMode="numeric"
          autoComplete="postal-code"
          defaultValue={v("postal_code", defaults.postal_code)}
          error={errors.postal_code}
        />
      </div>

      <Textarea
        name="bio"
        label="About you"
        rows={6}
        hint="Your own words. If you ever volunteer to instruct or assist, this same bio is what will appear on the public Instructors page — so write it as you'd want others to read it."
        defaultValue={v("bio", defaults.bio)}
        error={errors.bio}
      />

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save size={16} aria-hidden />
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
