"use client";

import { useState, useTransition } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { issueMissingQrs } from "./bulk-actions";

export function BulkIssueQrsButton() {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  function handleClick() {
    const ok = window.confirm(
      "Issue a QR code for every active member who doesn't have one yet?\n\n" +
        "Members who already have a QR will not be affected. To rotate an existing QR, use the per-member Regenerate button.",
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await issueMissingQrs();
      setToast(result.message);
      setTimeout(() => setToast(null), 4000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {toast && (
        <span className="text-sm text-muted-foreground" role="status">
          {toast}
        </span>
      )}
      <Button
        type="button"
        onClick={handleClick}
        variant="outline"
        size="sm"
        disabled={pending}
      >
        <QrCode size={14} aria-hidden />
        {pending ? "Issuing…" : "Bulk issue QRs"}
      </Button>
    </div>
  );
}
