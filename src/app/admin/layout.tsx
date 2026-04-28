import { requireStaff } from "@/lib/auth/dal";
import { AdminSidebar } from "@/components/admin/sidebar";
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
      {/* On desktop, the main column is the scroll container — not the
          body — so the vertical scrollbar appears inside the page content
          (right edge of `<main>`) rather than at the browser viewport
          edge. The sticky PageHeader + filters scroll inside `<main>` so
          they stay pinned without ever shrinking. Mobile keeps body
          scroll for the simpler stacked layout. */}
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-0 px-4 py-6 md:h-svh md:min-h-0 md:flex-row md:gap-10 md:overflow-hidden md:px-6 md:py-6">
        <AdminSidebar user={user} />

        <main id="main" className="min-w-0 flex-1 pt-6 md:overflow-x-hidden md:overflow-y-auto md:pt-0">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
