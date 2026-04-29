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
      {/* Frozen-pane layout on desktop: <main> is a flex column with NO
          overflow of its own. Pages render their PageHeader + filters +
          footer count as direct children that stay in flow at fixed
          height; the scrollable middle (table body, card grid, etc.) is
          a flex-1 child with overflow-y-auto, so the scrollbar lives
          inside the table region only. Mobile collapses to body scroll
          for the simpler stacked layout. */}
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-0 px-4 py-6 md:h-svh md:min-h-0 md:flex-row md:gap-10 md:overflow-hidden md:px-6 md:py-6">
        <AdminSidebar user={user} />

        <main id="main" className="flex min-w-0 flex-1 flex-col pt-6 md:min-h-0 md:overflow-hidden md:pt-0">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
