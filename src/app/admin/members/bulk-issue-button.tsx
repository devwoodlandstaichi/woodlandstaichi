"use client";

import { useState, useTransition } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { issueMissingQrs } from "./bulk-actions";

export function BulkIssueQrsButton() {
  const dialog = useConfirmDialog();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function onConfirm() {
    startTransition(async () => {
      const result = await issueMissingQrs();
      dialog.close();
      setToast(result.message);
      setTimeout(() => setToast(null), 5000);
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {toast && (
          <span className="text-sm text-muted-foreground" role="status">
            {toast}
          </span>
        )}
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
      </div>

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
