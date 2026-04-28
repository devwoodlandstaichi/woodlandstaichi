"use client";

import { useActionState } from "react";
import { Mail, Send } from "lucide-react";
import { Field, Textarea } from "@/components/form-fields";
import { submitContactForm, type ContactFormState } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactFormState,
    FormData
  >(submitContactForm, undefined);

  if (state && state.ok === true) {
    return (
      <div className="rounded-2xl border border-jade/30 bg-jade/5 p-7 md:p-9">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-jade/15 text-jade">
          <Mail size={20} aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-3xl md:text-4xl tracking-tight leading-[1.1]">
          Message sent.
          <span className="block italic text-vermillion">Thank you.</span>
        </h2>
        <p className="mt-4 text-base text-foreground/75 leading-relaxed max-w-lg">
          We&apos;ll reply by email shortly. If it&apos;s urgent, you can also
          email{" "}
          <a
            href="mailto:info@woodlandstaichi.com"
            className="underline decoration-vermillion underline-offset-4"
          >
            info@woodlandstaichi.com
          </a>{" "}
          directly.
        </p>
      </div>
    );
  }

  const errors = state && state.ok === false ? state.errors ?? {} : {};
  const values = state && state.ok === false ? state.values ?? {} : {};
  const banner = state && state.ok === false ? state.message : undefined;
  const formKey = state && state.ok === false ? "errored" : "fresh";

  return (
    <form
      key={formKey}
      action={formAction}
      noValidate
      className="grid gap-5 rounded-2xl border border-foreground/10 bg-card p-6 md:p-8"
    >
      {banner && (
        <p
          role="alert"
          className="rounded-md border border-vermillion/30 bg-vermillion/5 px-3 py-2 text-sm text-vermillion"
        >
          {banner}
        </p>
      )}

      {/* Honeypot — hidden from real users via CSS, bots fill it. */}
      <div aria-hidden className="absolute -left-[10000px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          name="name"
          label="Your name"
          required
          autoComplete="name"
          defaultValue={values.name}
          error={errors.name}
        />
        <Field
          name="email"
          label="Email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          defaultValue={values.email}
          error={errors.email}
        />
      </div>

      <Field
        name="phone"
        label="Phone (optional)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={values.phone}
        error={errors.phone}
      />

      <Textarea
        name="message"
        label="Message"
        required
        rows={7}
        hint="Questions about classes, registration, or anything else — we'd love to hear from you."
        defaultValue={values.message}
        error={errors.message}
      />

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? (
            "Sending…"
          ) : (
            <>
              <Send size={16} aria-hidden /> Send message
            </>
          )}
        </button>
        <p className="text-xs text-foreground/55">
          We don&apos;t share your information.
        </p>
      </div>
    </form>
  );
}
