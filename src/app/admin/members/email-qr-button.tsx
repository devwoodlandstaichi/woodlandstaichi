"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, QrCode, X } from "lucide-react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { emailQrToMember } from "./email-qr-action";
import { cn } from "@/lib/utils";

type Flash = "ok" | "err" | null;

const FLASH_MS = 3000;

/** A QR icon that opens a confirm dialog and emails the QR PNG to the
 * member when accepted. After confirm, the icon itself flashes to a
 * checkmark (success) or X (failure) for 3s and then reverts — so the
 * row layout never shifts. The detailed message goes to the global toast. */
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
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<Flash>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  function flashFor(tone: "ok" | "err") {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlash(tone);
    flashTimerRef.current = setTimeout(() => setFlash(null), FLASH_MS);
  }

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    dialog.show();
  }

  function onConfirm() {
    startTransition(async () => {
      const result = await emailQrToMember(memberId);
      dialog.close();
      if (result.ok) {
        flashFor("ok");
        toast({
          tone: "ok",
          title: `QR sent to ${memberName}`,
          description: result.message,
        });
      } else {
        flashFor("err");
        toast({
          tone: "err",
          title: "Couldn't send QR",
          description: result.message,
          duration: 8000,
        });
      }
    });
  }

  const verb = hasQr ? "Re-send" : "Issue and send";

  // Icon + colour reflect the current state. Same fixed 7×7 box so the
  // row geometry never moves between states.
  const Icon = flash === "ok" ? Check : flash === "err" ? X : QrCode;
  const iconClass =
    flash === "ok"
      ? "text-jade"
      : flash === "err"
        ? "text-destructive"
        : hasQr
          ? "text-vermillion/70"
          : "text-muted-foreground/50";

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={`Email QR to ${memberName}`}
        title={`Email QR to ${memberName}`}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          "hover:bg-vermillion/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          iconClass,
          pending && "opacity-60 cursor-not-allowed",
        )}
      >
        <Icon size={14} aria-hidden />
      </button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title={`${verb} the attendance QR?`}
        description={
          <>
            <p>
              The QR will be emailed to{" "}
              <strong className="text-foreground">{memberName}</strong> at{" "}
              <span className="font-mono text-foreground/85">{email}</span>.
            </p>
            {!hasQr && (
              <p className="mt-2 text-foreground/60">
                This member doesn&apos;t have a QR yet — one will be issued
                automatically as part of this email.
              </p>
            )}
          </>
        }
        confirmLabel={hasQr ? "Send again" : "Issue & send"}
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
