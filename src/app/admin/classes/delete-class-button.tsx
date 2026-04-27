"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui";
import { deleteClass } from "./actions";

export function DeleteClassButton({
  id,
  name,
  variant = "ghost",
  size = "sm",
}: {
  id: string;
  name: string;
  variant?: "ghost" | "outline" | "destructive";
  size?: "sm" | "default";
}) {
  return (
    <form
      action={deleteClass}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Permanently delete "${name}"? This also removes its sessions, registrations, and attendance records. This cannot be undone.\n\nIf you only want it off the public schedule, use Archive instead.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant={variant}
        size={size}
        className="text-destructive hover:bg-destructive/10"
        aria-label={`Delete ${name}`}
      >
        <Trash2 size={14} aria-hidden /> Delete
      </Button>
    </form>
  );
}
