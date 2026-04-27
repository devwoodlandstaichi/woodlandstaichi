import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/admin";

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

      <h1 className="font-display text-3xl font-medium tracking-tight">
        Staff sign-in
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        For instructors and admins only. If you&rsquo;re a member, you
        don&rsquo;t need an account yet.
      </p>

      {error === "unauthorized" && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          That account doesn&rsquo;t have admin access. Ask the founder to
          grant you a role.
        </p>
      )}

      <div className="mt-8">
        <LoginForm next={nextPath} />
      </div>
    </main>
  );
}
