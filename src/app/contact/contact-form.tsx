"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Field, Textarea } from "@/components/form-fields";
import { submitContactForm, type ContactFormState } from "./actions";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactFormState,
    FormData
  >(submitContactForm, undefined);

  if (state && state.ok === true) {
    return (
      <div className="rounded-xl border border-foreground/10 bg-card px-7 py-12 md:px-12 md:py-16 shadow-sm">
        <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6 rise">
          <span className="inline-block h-px w-8 align-middle bg-jade mr-3" />
          Sealed &amp; sent
        </p>
        <h3
          className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] rise"
          style={{ animationDelay: "120ms" }}
        >
          Your letter is
          <span className="block italic text-vermillion">on its way.</span>
        </h3>
        <p
          className="mt-7 max-w-lg text-lg text-foreground/75 leading-relaxed rise"
          style={{ animationDelay: "240ms" }}
        >
          We&apos;ll reply by email shortly. If it&apos;s urgent, you can
          also write directly to{" "}
          <a
            href="mailto:info@woodlandstaichi.com"
            className="underline decoration-vermillion underline-offset-4 hover:text-vermillion transition-colors"
          >
            info@woodlandstaichi.com
          </a>
          .
        </p>
        <div
          className="mt-10 flex items-center gap-5 fade"
          style={{ animationDelay: "360ms" }}
        >
          <span className="rule w-24" />
          <span aria-hidden className="text-vermillion text-xs">
            ◆
          </span>
          <Link
            href="/classes"
            className="font-mono text-xs uppercase tracking-[0.32em] text-foreground/65 hover:text-vermillion transition-colors"
          >
            Browse the schedule →
          </Link>
        </div>
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
      className="rounded-xl border border-foreground/10 bg-card px-6 py-7 md:px-10 md:py-10 shadow-sm"
    >
      {banner && (
        <p
          role="alert"
          className="mb-6 rounded-md border border-vermillion/30 bg-vermillion/5 px-3 py-2 text-sm text-vermillion"
        >
          {banner}
        </p>
      )}

      {/* Honeypot — hidden from real users via CSS, bots fill it. */}
      <div
        aria-hidden
        className="absolute -left-[10000px] h-0 w-0 overflow-hidden"
      >
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div
        className="grid gap-5 rise"
        style={{ animationDelay: "120ms" }}
      >
        <header className="flex items-baseline gap-3 flex-wrap">
          <span className="font-mono text-xs tabular-nums text-vermillion">
            01 / 02
          </span>
          <h3 className="font-display text-2xl tracking-tight">About you</h3>
        </header>
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
      </div>

      {/* Section divider — fading rule, no diamond at this scale */}
      <div className="my-9 rule" aria-hidden />

      <div
        className="grid gap-5 rise"
        style={{ animationDelay: "240ms" }}
      >
        <header className="flex items-baseline gap-3 flex-wrap">
          <span className="font-mono text-xs tabular-nums text-vermillion">
            02 / 02
          </span>
          <h3 className="font-display text-2xl tracking-tight">Your message</h3>
          <p className="basis-full text-sm text-foreground/65 leading-relaxed">
            Questions about classes, registration, or anything else — we&apos;d
            love to hear from you.
          </p>
        </header>

        <Textarea
          name="message"
          label="Message"
          required
          rows={8}
          defaultValue={values.message}
          error={errors.message}
        />
      </div>

      <div
        className="mt-9 flex flex-wrap items-center gap-5 rise"
        style={{ animationDelay: "360ms" }}
      >
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
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/50">
          We don&apos;t share your information.
        </p>
      </div>
    </form>
  );
}
