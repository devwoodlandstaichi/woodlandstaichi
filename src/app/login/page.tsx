import type { Metadata } from "next";
import Link from "next/link";
import { EmailForm } from "./email-form";
import { CodeForm } from "./code-form";
import { PasswordForm } from "./password/password-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Step = "password" | "email" | "code" | "unknown";

type SearchParams = Promise<{
  step?: string;
  email?: string;
  next?: string;
  error?: string;
}>;

function withNext(href: string, next: string) {
  return next && next !== "/admin"
    ? `${href}${href.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`
    : href;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const step: Step =
    params.step === "code"
      ? "code"
      : params.step === "unknown"
        ? "unknown"
        : params.step === "email"
          ? "email"
          : "password";
  const email = typeof params.email === "string" ? params.email : "";
  const next = typeof params.next === "string" ? params.next : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main
      id="main"
      className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16"
    >
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>←</span> Woodlands Tai Chi
      </Link>

      {step === "password" && <PasswordStep next={next} error={error} />}
      {step === "email" && <EmailStep next={next} error={error} />}
      {step === "code" && <CodeStep email={email} next={next} />}
      {step === "unknown" && <UnknownStep email={email} />}
    </main>
  );
}

function PasswordStep({ next, error }: { next: string; error: string }) {
  const codeHref = withNext("/login?step=email", next);
  return (
    <>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and password to sign in.
      </p>

      {error === "unauthorized" && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          That account doesn&rsquo;t have admin access.
        </p>
      )}

      <div className="mt-8">
        <PasswordForm next={next} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        First time, or haven&rsquo;t set a password yet?{" "}
        <Link
          href={codeHref}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Email me a one-time code
        </Link>
        .
      </p>
    </>
  );
}

function EmailStep({ next, error }: { next: string; error: string }) {
  const passwordHref = withNext("/login", next);
  return (
    <>
      <Link
        href={passwordHref}
        className="-mt-6 mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>←</span> Sign in with password instead
      </Link>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Email me a code
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&rsquo;ll send a one-time sign-in code. Useful if
        you haven&rsquo;t set a password yet.
      </p>

      {error === "unauthorized" && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          That account doesn&rsquo;t have admin access.
        </p>
      )}

      <div className="mt-8">
        <EmailForm next={next} />
      </div>
    </>
  );
}

function CodeStep({ email, next }: { email: string; next: string }) {
  return (
    <>
      <Link
        href={withNext("/login?step=email", next)}
        className="-mt-6 mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>←</span> Use a different email
      </Link>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Enter your code
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{email}</span>. Enter it
        below to sign in.
      </p>
      <div className="mt-8">
        <CodeForm email={email} next={next} />
      </div>
    </>
  );
}

function UnknownStep({ email }: { email: string }) {
  return (
    <>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        We don&rsquo;t see you yet
      </h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        We couldn&rsquo;t find{" "}
        <span className="font-medium text-foreground">{email}</span> on our
        roster. If you&rsquo;ve registered for a class, double-check the email
        you used. Otherwise, register for a class to join.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/classes/register"
          className="inline-flex items-center justify-center rounded-full bg-vermillion px-6 py-3 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
        >
          Register for a class →
        </Link>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Try a different email
        </Link>
      </div>
    </>
  );
}
