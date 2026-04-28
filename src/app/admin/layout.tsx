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
        {/* Sidebar — sticky on desktop, scrollable when items overflow.
            Inner flex-col makes the Sign-out button stick to the bottom
            while the nav scrolls in the middle. */}
        <aside className="md:sticky md:top-6 md:h-[calc(100svh-3rem)] md:w-56 md:shrink-0 md:flex md:flex-col">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← Public site
          </Link>

          <div className="mb-4">
            <p className="font-display text-lg font-medium tracking-tight leading-none">
              Admin
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground truncate">
              {user.email}{" "}
              <span className="ml-1 inline-block rounded-full border border-foreground/15 px-1.5 py-px text-[9px] uppercase tracking-wider">
                {user.role}
              </span>
            </p>
          </div>

          <div className="md:flex-1 md:min-h-0 md:overflow-y-auto md:-mr-2 md:pr-2">
            <AdminNav role={user.role} />
          </div>

          <form action={signOut} className="mt-4 md:mt-3 md:pt-3 md:border-t md:border-foreground/8">
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
