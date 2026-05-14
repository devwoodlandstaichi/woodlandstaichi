"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Mail,
  QrCode,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/admin/ui";
import { ExportButton } from "./export-button";
import { BulkIssueQrsButton } from "./bulk-issue-button";
import { BulkEmailQrsButton } from "./bulk-email-qrs-button";
import { DangerZoneButton } from "./danger-zone";

// Folds the four header-row action buttons (Export CSV, Bulk issue QRs,
// Bulk email QRs, Clear all members) into one dropdown to keep the
// PageHeader uncluttered. Each underlying component still owns its own
// modal — we just swap their default <Button> trigger for a menu item
// via the renderTrigger render-prop.

export function MembersActionsMenu({
  unsentQrs,
  canDelete,
}: {
  unsentQrs: number;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Click-outside + Escape to dismiss. We bind on next tick so the
  // click that opened the menu doesn't immediately close it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const t = window.setTimeout(() => {
      window.addEventListener("click", onClick);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Actions
        <ChevronDown
          size={14}
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[14rem] overflow-hidden rounded-xl border border-foreground/10 bg-card py-1 shadow-2xl"
        >
          <ExportButton
            renderTrigger={(openDialog) => (
              <MenuItem
                icon={<Download size={14} aria-hidden />}
                onClick={() => {
                  setOpen(false);
                  openDialog();
                }}
              >
                Export CSV
              </MenuItem>
            )}
          />

          <BulkIssueQrsButton
            renderTrigger={(openDialog) => (
              <MenuItem
                icon={<QrCode size={14} aria-hidden />}
                onClick={() => {
                  setOpen(false);
                  openDialog();
                }}
              >
                Bulk issue QRs
              </MenuItem>
            )}
          />

          {/* BulkEmailQrsButton renders null when unsentCount === 0; the
              menu item it provides simply won't appear in those cases. */}
          <BulkEmailQrsButton
            unsentCount={unsentQrs}
            renderTrigger={(openDialog) => (
              <MenuItem
                icon={<Mail size={14} aria-hidden />}
                onClick={() => {
                  setOpen(false);
                  openDialog();
                }}
              >
                Email {unsentQrs} QR{unsentQrs === 1 ? "" : "s"}
              </MenuItem>
            )}
          />

          {canDelete && (
            <>
              <div className="my-1 h-px bg-foreground/5" />
              <DangerZoneButton
                renderTrigger={(openDialog) => (
                  <MenuItem
                    destructive
                    icon={<Trash2 size={14} aria-hidden />}
                    onClick={() => {
                      setOpen(false);
                      openDialog();
                    }}
                  >
                    Clear all members
                  </MenuItem>
                )}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  destructive,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-foreground/5"
      }`}
    >
      <span className={destructive ? "" : "text-muted-foreground"}>
        {icon}
      </span>
      {children}
    </button>
  );
}
