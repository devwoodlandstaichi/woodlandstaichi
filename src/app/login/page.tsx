import type { Metadata } from "next";
import Link from "next/link";
import { EmailForm } from "./email-form";
import { CodeForm } from "./code-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Step = "email" | "code" | "unknown";

type SearchParams = Promise<{
  step?: string;
  email?: string;
  next?: string;
  error?: string;
}>;

function passwordHref(next: string) {
  return `/login/password${next && next !== "/admin" ? `?next=${encodeURIComponent(next)}` : ""}`;
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
        : "email";
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

      {step === "email" && <EmailStep next={next} error={error} />}
      {step === "code" && <CodeStep email={email} next={next} />}
      {step === "unknown" && <UnknownStep email={email} />}
    </main>
  );
}

function EmailStep({ next, error }: { next: string; error: string }) {
  return (
    <>
      <h1 className="font-display text-3xl font-medium tracking-tight">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&rsquo;ll send you a one-time sign-in code. No
        password required.
      </p>

      {error === "unauthorized" && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          That account doesn&rsquo;t have admin access.
        </p>
      )}

      <div className="mt-8">
        <EmailForm next={next} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Prefer a password?{" "}
        <Link
          href={passwordHref(next)}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Sign in with password
        </Link>
        .
      </p>
    </>
  );
}

function CodeStep({ email, next }: { email: string; next: string }) {
  return (
    <>
      <Link
        href="/login"
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
