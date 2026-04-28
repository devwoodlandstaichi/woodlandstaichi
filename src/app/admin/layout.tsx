import Link from "next/link";
import { requireStaff } from "@/lib/auth/dal";
import { AdminNav } from "@/components/admin/nav";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/admin/ui";
import { ToastProvider } from "@/components/admin/toast";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();

  return (
    <ToastProvider>
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-0 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
        <aside className="md:sticky md:top-10 md:h-[calc(100svh-5rem)] md:w-64 md:shrink-0">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Public site
          </Link>

          <div className="mb-6">
            <p className="font-display text-xl font-medium tracking-tight">
              Admin
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.email}{" "}
              <span className="ml-1 inline-block rounded-full border border-foreground/15 px-1.5 py-px text-[10px] uppercase tracking-wider">
                {user.role}
              </span>
            </p>
          </div>

          <AdminNav role={user.role} />

          <form action={signOut} className="mt-8">
            <Button type="submit" variant="ghost" size="sm" className="w-full">
              Sign out
            </Button>
          </form>
        </aside>

        <main id="main" className="min-w-0 flex-1 pt-6 md:pt-0">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
