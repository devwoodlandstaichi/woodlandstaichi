import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16"
    >
      <Link
        href="/login"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>←</span> Back to sign-in
      </Link>

      <h1 className="font-display text-3xl font-medium tracking-tight">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We&rsquo;ll email you a verification code. On the next page, enter it
        and choose a new password.
      </p>

      <div className="mt-8">
        <ForgotForm />
      </div>
    </main>
  );
}
