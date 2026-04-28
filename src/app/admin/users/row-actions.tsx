"use client";

import { useTransition } from "react";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/admin/ui";
import { changeUserRole, removeUser, sendPasswordReset } from "./actions";

type Role = "admin" | "instructor" | null;

export function UserRowActions({
  userId,
  email,
  role,
  isSelf,
}: {
  userId: string;
  email: string;
  role: Role;
  isSelf: boolean;
}) {
  const dialog = useConfirmDialog();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function changeRole(next: "admin" | "instructor") {
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set("role", next);
    startTransition(async () => {
      const r = await changeUserRole(fd);
      if (r.ok) {
        toast({
          tone: "ok",
          title: "Role updated",
          description: `${email} is now ${next}.`,
        });
      } else {
        toast({
          tone: "err",
          title: "Couldn't change role",
          description: r.message,
          duration: 8000,
        });
      }
    });
  }

  function resetPw() {
    startTransition(async () => {
      const r = await sendPasswordReset(email);
      toast({
        tone: r.ok ? "ok" : "err",
        title: r.ok ? "Reset email sent" : "Could not send reset",
        description: r.message,
      });
    });
  }

  function confirmDelete() {
    dialog.show();
  }

  function doDelete() {
    startTransition(async () => {
      const r = await removeUser(userId);
      dialog.close();
      if (r.ok) {
        toast({
          tone: "ok",
          title: "User deleted",
          description: `${email} has been removed.`,
        });
      } else {
        toast({
          tone: "err",
          title: "Could not delete",
          description: r.message,
          duration: 8000,
        });
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {role !== "admin" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => changeRole("admin")}
          >
            Make admin
          </Button>
        )}
        {role !== "instructor" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => changeRole("instructor")}
          >
            Make instructor
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={resetPw}
        >
          Reset password
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending || isSelf}
          onClick={confirmDelete}
          className="text-destructive hover:bg-destructive/10"
          title={isSelf ? "You can't delete yourself" : "Delete user"}
        >
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        title={`Delete ${email}?`}
        description={
          <>
            <p>
              This permanently removes the auth account and any role grants.
              They&apos;ll lose access to <strong>/admin</strong> immediately.
            </p>
            <p className="mt-2 text-foreground/60">
              Their member record (if any) is unaffected.
            </p>
          </>
        }
        confirmLabel="Delete user"
        tone="destructive"
        pending={pending}
        onConfirm={doDelete}
      />
    </>
  );
}
