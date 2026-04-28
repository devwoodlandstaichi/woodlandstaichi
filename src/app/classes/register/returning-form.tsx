"use client";

import { useActionState } from "react";
import {
  Field,
  Textarea,
  RadioGroup,
  Checkbox,
  FormSection,
} from "@/components/form-fields";
import {
  submitReturningRegistration,
  type RegistrationState,
} from "./actions";
import type { SessionOption } from "./registration-form";

const PHONE_FIELD_NAMES = new Set(["phone", "emergency_phone"]);

function formatUsPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const d =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (d.length !== 10) return raw;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const INITIAL: RegistrationState = { status: "idle" };

export function ReturningRegistrationForm({
  sessions,
}: {
  sessions: SessionOption[];
}) {
  const [state, formAction, pending] = useActionState(
    submitReturningRegistration,
    INITIAL,
  );
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const submitted = state.status === "error" ? state.values ?? {} : {};
  const v = (key: string) => submitted[key] ?? "";
  const checked = (key: string) => {
    const val = submitted[key];
    return val === "on" || val === "true" || val === "1";
  };

  const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (!PHONE_FIELD_NAMES.has(t.name)) return;
    const next = formatUsPhone(t.value);
    if (next !== t.value) t.value = next;
  };

  return (
    <form
      action={formAction}
      onBlur={handleBlur}
      className="space-y-12"
      noValidate
    >
      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-vermillion bg-vermillion/5 p-4 text-vermillion"
        >
          {state.message}
        </div>
      )}

      <FormSection
        number={1}
        title="About you"
        description="Just confirming the basics."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="first_name"
            label="First name"
            required
            autoComplete="given-name"
            defaultValue={v("first_name")}
            error={errors.first_name}
          />
          <Field
            name="last_name"
            label="Last name"
            required
            autoComplete="family-name"
            defaultValue={v("last_name")}
            error={errors.last_name}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="email"
            label="Email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            defaultValue={v("email")}
            error={errors.email}
          />
          <Field
            name="phone"
            label="Cell phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="(000) 000-0000"
            defaultValue={v("phone")}
            error={errors.phone}
          />
        </div>
      </FormSection>

      <FormSection
        number={2}
        title="Address change?"
        description="Optional — only fill in if your address has changed since you last registered."
      >
        <Field
          name="street"
          label="Street address"
          autoComplete="address-line1"
          defaultValue={v("street")}
          error={errors.street}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            name="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={v("city")}
            error={errors.city}
          />
          <Field
            name="state"
            label="State"
            autoComplete="address-level1"
            defaultValue={v("state")}
            error={errors.state}
          />
          <Field
            name="postal_code"
            label="ZIP"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={v("postal_code")}
            error={errors.postal_code}
          />
        </div>
      </FormSection>

      <FormSection
        number={3}
        title="Pick your class"
        description="Choose the session you'd like to attend. Beginners must use the new-member registration."
      >
        <RadioGroup
          name="class_id"
          label="Class"
          required
          options={sessions}
          defaultValue={v("class_id")}
          error={errors.class_id}
        />
      </FormSection>

      <FormSection
        number={4}
        title="Anything we should know?"
        description="Let instructors know about any health changes, injuries, or anything else since your last enrollment."
      >
        <Textarea
          name="status_changes"
          label="Change in status since last registration"
          hint="Optional. Health, mobility, contact preferences, etc."
          rows={4}
          defaultValue={v("status_changes")}
          error={errors.status_changes}
        />
      </FormSection>

      <FormSection
        number={5}
        title="Emergency contact"
        description="Required — please confirm we still have the right person on file."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="emergency_name"
            label="Emergency contact name"
            required
            autoComplete="off"
            defaultValue={v("emergency_name")}
            error={errors.emergency_name}
          />
          <Field
            name="emergency_relationship"
            label="Relationship"
            required
            placeholder="Spouse, child, friend…"
            defaultValue={v("emergency_relationship")}
            error={errors.emergency_relationship}
          />
        </div>
        <Field
          name="emergency_phone"
          label="Emergency contact phone"
          type="tel"
          required
          inputMode="tel"
          placeholder="(000) 000-0000"
          defaultValue={v("emergency_phone")}
          error={errors.emergency_phone}
        />
      </FormSection>

      <FormSection
        number={6}
        title="Waiver"
        description="Required for all participants — please re-sign each season."
      >
        <div className="rounded-md border border-foreground/15 bg-secondary p-5 text-sm text-foreground/80 leading-relaxed max-h-72 overflow-y-auto space-y-3">
          <p>
            Prior to registering for this class, it is recommended that you
            consult your physician.
          </p>
          <p>
            In consideration of being allowed to participate in any program,
            activity, or event sponsored by, performed by, or in any way
            involving Woodlands Tai Chi and/or Sifu Sesco Saegusa (the
            &ldquo;Program&rdquo;), I — as Participant, or as parent or
            guardian of a minor Participant — and intending to be legally
            bound, do hereby acknowledge and agree to the following:
          </p>
          <p>
            I waive, discharge, and release any and all rights and claims for
            damages — whether based upon negligence or any other theory of law
            — which I, my child, or my heirs may have against Woodlands Tai
            Chi and/or Sifu Sesco Saegusa, their affiliates, agents,
            representatives, assigns, successors, and any officers, directors,
            shareholders, agents, or employees, the municipalities or counties
            in or through which the programs take place, or any other person,
            entity, or sponsor connected with the Program, for any and all
            injuries or damages I or my child may suffer while participating.
          </p>
          <p>
            I assume any and all risks resulting from my or my child&apos;s
            participation, and accept full personal responsibility for any
            resulting damage including injury, permanent disability, or death.
          </p>
          <p>
            I verify that I (or my child) am in good physical health and able
            to participate in and/or complete the Program.
          </p>
          <p>
            I agree to indemnify and hold Woodlands Tai Chi and Sifu Sesco
            Saegusa harmless from and against all liabilities for any injury
            arising out of or connected with participation in the Program.
          </p>
          <p>
            I have read and fully understood this waiver and release. I
            understand that by participating, I/we will have waived
            substantial rights. I have knowingly and voluntarily agreed to
            this waiver and release.
          </p>
        </div>
        <Checkbox
          name="waiver_accepted"
          label="I have read and agree to the Waiver and Release."
          required
          defaultChecked={checked("waiver_accepted")}
          error={errors.waiver_accepted}
        />
        <Field
          name="waiver_signature"
          label="Type your full name as your signature"
          required
          hint="By typing your name, you electronically sign the waiver above."
          defaultValue={v("waiver_signature")}
          error={errors.waiver_signature}
        />
      </FormSection>

      <div className="flex flex-col gap-4 border-t border-foreground/10 pt-8">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-3 self-start rounded-full bg-vermillion px-8 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Submitting…" : "Submit re-registration"}
          {!pending && <span aria-hidden>→</span>}
        </button>
      </div>
    </form>
  );
}
