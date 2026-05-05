import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Enter your code",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ email?: string }>;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { email } = await searchParams;
  if (!email) {
    redirect("/login/forgot");
  }

  return (
    <main
      id="main"
      className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16"
    >
      <Link
        href="/login/forgot"
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>←</span> Use a different email
      </Link>

      <h1 className="font-display text-3xl font-medium tracking-tight">
        Enter your code
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a code to{" "}
        <span className="font-medium text-foreground">{email}</span>. Enter
        it below along with your new password.
      </p>

      <div className="mt-8">
        <VerifyForm email={email} />
      </div>
    </main>
  );
}
