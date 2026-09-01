"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteRegistration } from "./actions";
import { Button } from "@/components/admin/ui";

export function DeleteRegistrationButton({
  id,
  memberName,
  redirectAfter,
}: {
  id: string;
  memberName?: string;
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const label = memberName ? `${memberName}'s registration` : "this registration";
    if (!confirm(`Delete ${label}? This cannot be undone. Use Deny instead to keep an audit trail.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteRegistration(fd);
      if (redirectAfter) {
        window.location.href = redirectAfter;
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="text-destructive hover:text-destructive"
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
