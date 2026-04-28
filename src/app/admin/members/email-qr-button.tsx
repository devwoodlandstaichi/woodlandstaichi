"use client";

import { useState, useTransition } from "react";
import { QrCode } from "lucide-react";
import { emailQrToMember } from "./email-qr-action";
import { cn } from "@/lib/utils";

/** A QR icon that, when clicked, asks the staff to confirm and emails the
 * code to the member. Used in the members table row, alongside the name. */
export function EmailQrButton({
  memberId,
  memberName,
  email,
  hasQr,
}: {
  memberId: string;
  memberName: string;
  email: string;
  hasQr: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const verb = hasQr ? "Re-send" : "Issue and send";
    const ok = window.confirm(
      `${verb} the attendance QR to ${memberName}?\n\n` +
        `It will be emailed to ${email}.` +
        (hasQr
          ? ""
          : "\n\nThis member doesn't have a QR yet — one will be issued automatically."),
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await emailQrToMember(memberId);
      setToast({
        tone: result.ok ? "ok" : "err",
        msg: result.message,
      });
      setTimeout(() => setToast(null), 5000);
    });
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={`Email QR to ${memberName}`}
        title={`Email QR to ${memberName}`}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "hover:bg-vermillion/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hasQr ? "text-vermillion/70" : "text-muted-foreground/50",
          pending && "opacity-60 cursor-not-allowed",
        )}
      >
        <QrCode size={14} aria-hidden />
      </button>
      {toast && (
        <span
          role="status"
          className={cn(
            "absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-xs shadow-sm z-10",
            toast.tone === "ok"
              ? "bg-jade/10 border-jade/30 text-jade"
              : "bg-destructive/10 border-destructive/30 text-destructive",
          )}
        >
          {toast.msg}
        </span>
      )}
    </span>
  );
}
