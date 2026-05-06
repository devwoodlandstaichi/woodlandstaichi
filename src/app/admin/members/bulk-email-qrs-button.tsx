"use client";

import { useTransition } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { bulkEmailQrUnsent } from "./bulk-email-qrs";

export function BulkEmailQrsButton({ unsentCount }: { unsentCount: number }) {
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await bulkEmailQrUnsent();
      dialog.close();
      toast({
        tone: result.sent > 0 ? "ok" : "info",
        title:
          result.sent > 0
            ? `Sent ${result.sent} QR${result.sent === 1 ? "" : "s"}`
            : "No QRs sent",
        description: result.message,
      });
    });
  }

  // Hide entirely when there's nothing queued — keeps the toolbar
  // honest about what's actionable. The Issue Missing QRs button
  // already covers the "nobody has a token yet" case.
  if (unsentCount === 0) return null;

  return (
    <>
      <Button
        type="button"
        onClick={dialog.show}
        variant="outline"
        size="sm"
        disabled={pending}
      >
        <Mail size={14} aria-hidden />
        {pending
          ? "Sending…"
          : `Email ${unsentCount} QR${unsentCount === 1 ? "" : "s"}`}
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title={
          unsentCount === 1
            ? "Email QR to 1 member?"
            : `Email QRs to ${unsentCount} members?`
        }
        description={
          <>
            <p>
              Every active member with a QR who hasn&apos;t been emailed yet
              will receive their attendance badge.
            </p>
            <p className="mt-2 text-foreground/60">
              We send up to 50 emails per click — if there are more queued,
              click again to send the next batch.
            </p>
          </>
        }
        confirmLabel={
          unsentCount === 1
            ? "Send 1 QR"
            : `Send ${Math.min(unsentCount, 50)} QR${
                Math.min(unsentCount, 50) === 1 ? "" : "s"
              }`
        }
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
