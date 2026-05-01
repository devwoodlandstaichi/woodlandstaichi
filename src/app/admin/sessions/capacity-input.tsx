"use client";

import { useTransition } from "react";
import { setSessionCapacity } from "./actions";

// Inline editable per-session capacity. Empty value posts NULL — meaning
// "inherit from class.capacity". The placeholder hints at that
// inherited number so an instructor knows what they're overriding.

export function CapacityInput({
  sessionId,
  capacity,
  classCapacity,
}: {
  sessionId: string;
  capacity: number | null;
  classCapacity: number | null;
}) {
  const [pending, startTransition] = useTransition();

  function commit(input: HTMLInputElement) {
    const raw = input.value.trim();
    const parsed = raw === "" ? null : Number(raw);

    if (parsed === capacity) return;
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 0)) {
      input.value = capacity?.toString() ?? "";
      return;
    }

    const fd = new FormData();
    fd.set("id", sessionId);
    if (parsed !== null) fd.set("capacity", String(parsed));

    startTransition(async () => {
      await setSessionCapacity(fd);
    });
  }

  const inheritsFromClass = capacity === null;

  return (
    <input
      type="number"
      min={0}
      step={1}
      defaultValue={capacity ?? ""}
      placeholder={classCapacity != null ? String(classCapacity) : "—"}
      disabled={pending}
      onBlur={(e) => commit(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.value = capacity?.toString() ?? "";
          e.currentTarget.blur();
        }
      }}
      aria-label={
        inheritsFromClass
          ? `Set capacity (currently inherits ${classCapacity ?? "no limit"})`
          : "Set capacity"
      }
      title={
        inheritsFromClass
          ? "Empty = inherit class default. Type a number to override."
          : "Override capacity. Clear to inherit class default."
      }
      className={`h-9 w-16 rounded-md border bg-background px-2 text-sm tabular-nums shadow-sm transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        inheritsFromClass
          ? "border-foreground/15 text-muted-foreground placeholder:text-muted-foreground/50"
          : "border-input text-foreground"
      }`}
    />
  );
}
