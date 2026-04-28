import { requireStaff } from "@/lib/auth/dal";
import { ToastProvider } from "@/components/admin/toast";

// Kiosk-mode layout: no sidebar, no nav, no public-site header.
// Just the scanner. Lives outside /admin/* on purpose so the
// admin chrome doesn't render at all (and isn't even in the DOM
// to be revealed by inspecting CSS).
//
// Auth-gated by requireStaff() exactly like /admin/* — only signed-in
// instructors and admins can hit a /scan/<id> URL.

export const dynamic = "force-dynamic";

export default async function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();
  return (
    <ToastProvider>
      <div className="min-h-svh bg-background">{children}</div>
    </ToastProvider>
  );
}
