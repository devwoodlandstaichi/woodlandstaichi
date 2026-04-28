"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { Button, Field, Input } from "@/components/admin/ui";
import { verifyPinAction } from "@/app/admin/settings/kiosk/actions";

export function ExitKiosk({ pinRequired }: { pinRequired: boolean }) {
  const router = useRouter();
  const dialog = useConfirmDialog();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the PIN input when the dialog opens.
  useEffect(() => {
    if (dialog.open && pinRequired) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [dialog.open, pinRequired]);

  function leave() {
    router.push("/admin/attendance");
  }

  function onConfirm() {
    if (!pinRequired) {
      leave();
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await verifyPinAction(pin);
      if (r.ok) {
        leave();
      } else {
        setError("That PIN is incorrect.");
        setPin("");
        inputRef.current?.focus();
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setPin("");
          setError(null);
          dialog.show();
        }}
        aria-label="Exit kiosk mode"
      >
        <LogOut size={14} aria-hidden /> Exit kiosk
      </Button>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title={pinRequired ? "Enter PIN to exit" : "Exit kiosk mode?"}
        description={
          pinRequired ? (
            <div className="grid gap-2">
              <p>
                Kiosk mode is locked. An admin or instructor must enter
                the kiosk PIN to return to the admin pages.
              </p>
              <Field label="Kiosk PIN" htmlFor="kiosk-exit-pin">
                <Input
                  ref={inputRef}
                  id="kiosk-exit-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="\d{4,8}"
                  minLength={4}
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onConfirm();
                    }
                  }}
                  className="font-mono tracking-[0.4em] text-center"
                  placeholder="••••"
                />
              </Field>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <p>
              You&apos;ll be returned to the admin pages where the rest
              of the site is reachable.
            </p>
          )
        }
        confirmLabel={pinRequired ? "Unlock & exit" : "Exit"}
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  );
}
