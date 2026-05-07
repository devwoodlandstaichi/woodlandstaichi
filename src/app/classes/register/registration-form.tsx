"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Field,
  Textarea,
  Select,
  RadioGroup,
  Checkbox,
  FormSection,
} from "@/components/form-fields";
import { Listbox } from "@/components/listbox";
import { submitRegistration, type RegistrationState } from "./actions";
import {
  PAYMENT_METHODS,
  SEX_OPTIONS,
  SHIRT_SIZES,
} from "./schema";

// Inputs whose value should be normalized to "(xxx) xxx-xxxx" when the
// user tabs/clicks away. Whatever digits they typed get reformatted; if
// it's not a US-shaped 10-digit number we leave the input alone so the
// zod regex can flag it as invalid.
const PHONE_FIELD_NAMES = new Set(["phone", "emergency_phone"]);

function formatUsPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const d =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (d.length !== 10) return raw;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export type SessionOption = { value: string; label: string; sub?: string };

const SHIRT_OPTIONS = SHIRT_SIZES.map((s) => ({ value: s, label: s }));

const INITIAL: RegistrationState = { status: "idle" };

export function RegistrationForm({ sessions }: { sessions: SessionOption[] }) {
  const [state, formAction, pending] = useActionState(submitRegistration, INITIAL);
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  // React 19's form actions reset uncontrolled fields once the action
  // returns. `defaultValue` only re-applies on mount, so we re-key the
  // form on every failed-submit transition. That forces React to remount
  // all inputs, and the replayed `defaultValue`s from `state.values` take
  // effect — keeping everything the user already typed.
  const [submitCount, setSubmitCount] = useState(0);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "error") setSubmitCount((c) => c + 1);
  }
  const formKey = `s-${submitCount}`;

  // After the server action returns errors, jump the user to the first
  // invalid field. Scroll into view + focus so the next keystroke goes
  // straight there. Each new error state is a new object reference, so
  // this fires once per failed submit.
  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors) return;
    const firstKey = Object.keys(state.fieldErrors)[0];
    if (!firstKey) return;
    const el =
      document.getElementById(firstKey) ??
      document.querySelector<HTMLElement>(`[name="${firstKey}"]`);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        el.focus({ preventScroll: true });
      }
    });
  }, [state]);

  // React 19's form actions reset uncontrolled forms once the action
  // returns, so we round-trip the user's typed values through state
  // and replay them as defaultValue/defaultChecked.
  const submitted = state.status === "error" ? state.values ?? {} : {};
  const v = (key: string) => submitted[key] ?? "";
  const checked = (key: string) => {
    const val = submitted[key];
    return val === "on" || val === "true" || val === "1";
  };

  // React's onBlur synthesizes bubbling, so a single handler at the form
  // catches focus-out from any descendant input. We match on `name` to
  // avoid coupling Field to a phone-specific prop.
  const handleBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (!PHONE_FIELD_NAMES.has(t.name)) return;
    const next = formatUsPhone(t.value);
    if (next !== t.value) t.value = next;
  };

  return (
    <form
      key={formKey}
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
        description="Where to reach you and a little context."
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
        <Field
          name="nickname"
          label="Nickname"
          hint="What you'd like us to call you in class."
          autoComplete="nickname"
          defaultValue={v("nickname")}
          error={errors.nickname}
        />
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
        <Field
          name="street"
          label="Street address"
          required
          autoComplete="address-line1"
          defaultValue={v("street")}
          error={errors.street}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            name="city"
            label="City"
            required
            autoComplete="address-level2"
            defaultValue={v("city")}
            error={errors.city}
          />
          <Field
            name="state"
            label="State"
            required
            autoComplete="address-level1"
            defaultValue={v("state")}
            error={errors.state}
          />
          <Field
            name="postal_code"
            label="ZIP"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={v("postal_code")}
            error={errors.postal_code}
          />
        </div>
        <Field
          name="birthday"
          label="Birthday"
          type="date"
          required
          hint="Your real birthday — kept private."
          autoComplete="bday"
          defaultValue={v("birthday")}
          error={errors.birthday}
        />
        <Select
          name="sex"
          label="Sex"
          required
          options={SEX_OPTIONS}
          placeholder="Pick one"
          defaultValue={v("sex")}
          error={errors.sex}
          className="sm:w-1/2"
        />
      </FormSection>

      <FormSection
        number={2}
        title="Pick your first session"
        description="Pick from upcoming dates our instructors have marked welcoming for newcomers. Show up, observe, ask questions — that's the whole assignment."
      >
        <Listbox
          name="session_id"
          label="Session"
          required
          options={sessions}
          defaultValue={v("session_id")}
          error={errors.session_id}
          hint="Listed earliest first."
          placeholder="Choose a date…"
        />
      </FormSection>

      <FormSection
        number={3}
        title="Health & experience"
        description="So instructors can support you well from day one."
      >
        <Textarea
          name="physical_limitations"
          label="Any physical limitations?"
          hint="Optional. Anything we should know — knee, back, balance, recent injuries, surgeries, etc."
          rows={3}
          defaultValue={v("physical_limitations")}
          error={errors.physical_limitations}
        />
        <Textarea
          name="prior_experience"
          label="Any prior Tai Chi experience?"
          hint="Optional. Style, school, instructor, how long."
          rows={3}
          defaultValue={v("prior_experience")}
          error={errors.prior_experience}
        />
      </FormSection>

      <FormSection
        number={4}
        title="Shirt & payment"
        description="Class is free — the WTC shirt is the only fee, paid at registration."
      >
        <Select
          name="shirt_size"
          label="Shirt size"
          required
          options={SHIRT_OPTIONS}
          hint="See the size chart on the Store page."
          defaultValue={v("shirt_size")}
          error={errors.shirt_size}
        />
        <RadioGroup
          name="payment_method"
          label="Payment method"
          required
          options={PAYMENT_METHODS}
          defaultValue={v("payment_method")}
          error={errors.payment_method}
        />
      </FormSection>

      <FormSection
        number={5}
        title="A little more about you"
        description="We're a small community — these answers help us welcome you."
      >
        <Textarea
          name="found_us_via"
          label="How did you find Woodlands Tai Chi?"
          required
          rows={2}
          defaultValue={v("found_us_via")}
          error={errors.found_us_via}
        />
        <Textarea
          name="expectations"
          label="What do you hope to gain from Tai Chi?"
          required
          rows={3}
          defaultValue={v("expectations")}
          error={errors.expectations}
        />
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
        description="Required for all participants. Read carefully before signing."
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

      <FormSection
        number={7}
        title="Church waiver"
        description="A separate waiver, completed on the church's site."
      >
        <div className="rounded-md border border-foreground/15 bg-secondary p-5 text-sm text-foreground/80 leading-relaxed space-y-3">
          <p>
            We meet at <strong>The Woodlands Methodist Church</strong> for
            most sessions. The church requires every fitness-program
            participant to complete its own waiver — separate from the one
            above — before using their facility.
          </p>
          <p className="text-foreground/65">
            Please open the link below and complete the church&rsquo;s waiver
            before your first class. It only takes a minute and is good for
            the year.
          </p>
        </div>
        <a
          href="https://thewoodlandsmethodist.org/fitness"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-foreground/5 hover:border-foreground/30 transition-colors w-fit"
        >
          Open the church waiver
          <span aria-hidden>↗</span>
        </a>
      </FormSection>

      <div className="flex flex-col gap-4 border-t border-foreground/10 pt-8">
        <p className="text-sm text-foreground/60">
          You aren&apos;t enrolled until payment is received. We&apos;ll email
          you with the next steps right after submission.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-3 self-start rounded-full bg-vermillion px-8 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Submitting…" : "Submit registration"}
          {!pending && <span aria-hidden>→</span>}
        </button>
      </div>
    </form>
  );
}
