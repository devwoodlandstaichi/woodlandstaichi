import { requireAdmin } from "@/lib/auth/dal";
import { isKioskPinSet } from "@/lib/settings/kiosk-pin";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { KioskPinForm } from "./pin-form";
import { ClearPinButton } from "./clear-pin-button";

export const metadata = { title: "Kiosk PIN" };
export const dynamic = "force-dynamic";

export default async function KioskSettingsPage() {
  await requireAdmin();
  const pinSet = await isKioskPinSet();

  return (
    <>
      <PageHeader
        title="Kiosk PIN"
        description="A short numeric PIN gates exit from kiosk mode so curious members can't drop themselves back into the admin area."
      />

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Current state
            </p>
            <p className="mt-1.5 font-display text-xl">
              {pinSet ? (
                <>
                  <Badge tone="jade">PIN active</Badge>{" "}
                  <span className="text-foreground/80 text-base align-middle">
                    Exit asks for it.
                  </span>
                </>
              ) : (
                <>
                  <Badge tone="muted">No PIN set</Badge>{" "}
                  <span className="text-foreground/80 text-base align-middle">
                    Anyone can exit kiosk mode without challenge.
                  </span>
                </>
              )}
            </p>
          </div>
          {pinSet && <ClearPinButton />}
        </div>
      </Card>

      <Card className="p-6 max-w-md">
        <h2 className="font-display text-lg font-medium tracking-tight">
          {pinSet ? "Change PIN" : "Set a PIN"}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          4–8 digits. Setting a new PIN replaces the old one immediately.
        </p>
        <div className="mt-5">
          <KioskPinForm pinSet={pinSet} />
        </div>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground max-w-md leading-relaxed">
        The PIN is hashed with HMAC-SHA256 + a per-row random salt before
        storage. Even if the database is leaked, brute-forcing a 6-digit
        PIN against the hash is reasonable to defend by rate-limiting
        verification (TODO).
      </p>
      </div>
    </>
  );
}
