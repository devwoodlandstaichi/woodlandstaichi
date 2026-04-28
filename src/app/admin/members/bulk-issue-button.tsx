"use client";

import { useTransition } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { issueMissingQrs } from "./bulk-actions";

export function BulkIssueQrsButton() {
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await issueMissingQrs();
      dialog.close();
      toast({
        tone: result.issued > 0 ? "ok" : "info",
        title:
          result.issued > 0
            ? `Issued ${result.issued} QR${result.issued === 1 ? "" : "s"}`
            : "No QRs issued",
        description: result.message,
      });
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={dialog.show}
        variant="outline"
        size="sm"
        disabled={pending}
      >
        <QrCode size={14} aria-hidden />
        {pending ? "Issuing…" : "Bulk issue QRs"}
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title="Issue QRs for everyone without one?"
        description={
          <>
            <p>
              Every active member who doesn&apos;t yet have a QR will get a
              fresh one. Members who already have a QR will not be affected.
            </p>
            <p className="mt-2 text-foreground/60">
              To rotate an existing QR, use the per-member Regenerate button
              instead.
            </p>
          </>
        }
        confirmLabel="Issue missing QRs"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
