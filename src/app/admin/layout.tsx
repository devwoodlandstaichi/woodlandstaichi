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
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col gap-0 px-4 py-6 md:flex-row md:gap-10 md:px-6 md:py-10">
        <AdminSidebar user={user} />

        <main id="main" className="min-w-0 flex-1 pt-6 md:pt-0">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
