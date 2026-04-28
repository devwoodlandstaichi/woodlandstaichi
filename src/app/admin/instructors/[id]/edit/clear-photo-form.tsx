"use client";

import { X as XIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/admin/ui";
import { clearPhoto } from "../../actions";

export function ClearPhotoForm({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        startTransition(() => {
          void clearPhoto(fd);
        });
      }}
    >
      <XIcon size={14} aria-hidden /> Remove
    </Button>
  );
}
