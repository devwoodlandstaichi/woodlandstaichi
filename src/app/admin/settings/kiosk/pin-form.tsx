"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field, Input } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { setPinAction, type SetPinState } from "./actions";

export function KioskPinForm({ pinSet }: { pinSet: boolean }) {
  const [state, action, pending] = useActionState<SetPinState, FormData>(
    setPinAction,
    undefined,
  );
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast({ tone: "ok", title: state.message });
      formRef.current?.reset();
    } else {
      toast({ tone: "err", title: state.message, duration: 6000 });
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      <Field label="New PIN" htmlFor="pin">
        <Input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="\d{4,8}"
          minLength={4}
          maxLength={8}
          required
          className="font-mono tracking-[0.4em]"
          placeholder="••••"
        />
      </Field>
      <Field label="Confirm PIN" htmlFor="confirm">
        <Input
          id="confirm"
          name="confirm"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="\d{4,8}"
          minLength={4}
          maxLength={8}
          required
          className="font-mono tracking-[0.4em]"
          placeholder="••••"
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : pinSet ? "Update PIN" : "Set PIN"}
        </Button>
      </div>
    </form>
  );
}
