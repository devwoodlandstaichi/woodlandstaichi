import type { Metadata } from "next";
import Link from "next/link";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Sign in with password",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function PasswordLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/admin";
  const codeHref = `/login${nextPath !== "/admin" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  return (
    <main
      id="main"
      className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-16"
    >
      <Link
        href={codeHref}
        className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden>←</span> Use a sign-in code instead
      </Link>

      <h1 className="font-display text-3xl font-medium tracking-tight">
        Sign in with password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        For staff and members who&rsquo;ve set a password.
      </p>

      {error === "unauthorized" && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          That account doesn&rsquo;t have admin access. Ask the founder to
          grant you a role.
        </p>
      )}

      <div className="mt-8">
        <PasswordForm next={nextPath} />
      </div>
    </main>
  );
}
