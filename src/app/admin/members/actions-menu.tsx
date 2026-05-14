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
import {
  ExportButton,
  type ExportButtonHandle,
} from "./export-button";
import {
  BulkIssueQrsButton,
  type BulkIssueQrsButtonHandle,
} from "./bulk-issue-button";
import {
  BulkEmailQrsButton,
  type BulkEmailQrsButtonHandle,
} from "./bulk-email-qrs-button";
import {
  DangerZoneButton,
  type DangerZoneButtonHandle,
} from "./danger-zone";
import { useMembersSelection } from "./members-selection";

// Folds the four header-row action buttons into one dropdown. Each
// underlying component stays mounted unconditionally — they own their
// modal state internally — and we trigger them via imperative refs
// from the menu items. Earlier version had the action components
// inside `{open && ...}`, which unmounted them (and their dialog
// state) the moment the menu closed; that's why clicks did nothing.

export function MembersActionsMenu({
  unsentQrs,
  canDelete,
}: {
  unsentQrs: number;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Read selection from the shared context (populated by MembersTable).
  // When empty, the export menu item labels itself "Export all
  // members" and the route uses the page's filter/sort. When
  // populated, the label becomes "Export N members" and the route is
  // scoped via `?ids=...`.
  const { selected } = useMembersSelection();
  const selectedIds = [...selected];
  const hasSelection = selectedIds.length > 0;
  const exportLabel = hasSelection
    ? `Export ${selectedIds.length} member${selectedIds.length === 1 ? "" : "s"}`
    : "Export all members";

  const exportRef = useRef<ExportButtonHandle>(null);
  const bulkIssueRef = useRef<BulkIssueQrsButtonHandle>(null);
  const bulkEmailRef = useRef<BulkEmailQrsButtonHandle>(null);
  const dangerRef = useRef<DangerZoneButtonHandle>(null);

  // Click-outside + Escape to dismiss the dropdown. Bound on next
  // tick so the click that opened the menu doesn't immediately close
  // it. We don't dismiss when the user clicks a menu item — that's
  // handled explicitly in `runFromMenu` below, which also fires the
  // underlying dialog *after* the dropdown has unmounted.
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

  // Close the dropdown first, then fire the underlying dialog on the
  // next tick so the dropdown's unmount completes before the modal's
  // focus-trap kicks in. Without the deferral, the modal would briefly
  // contend with the dropdown for keyboard focus.
  function runFromMenu(action: () => void) {
    setOpen(false);
    setTimeout(action, 0);
  }

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

      {/* Action components stay mounted regardless of the dropdown's
          open state so their internal dialog state survives a menu
          close. Their default <Button> trigger is suppressed via
          `renderTrigger={() => null}`; we open them imperatively. */}
      <ExportButton
        ref={exportRef}
        renderTrigger={() => null}
        selectedIds={hasSelection ? selectedIds : undefined}
      />
      <BulkIssueQrsButton ref={bulkIssueRef} renderTrigger={() => null} />
      <BulkEmailQrsButton
        unsentCount={unsentQrs}
        ref={bulkEmailRef}
        renderTrigger={() => null}
      />
      {canDelete && (
        <DangerZoneButton ref={dangerRef} renderTrigger={() => null} />
      )}

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 min-w-[14rem] overflow-hidden rounded-xl border border-foreground/10 bg-card py-1 shadow-2xl"
        >
          <MenuItem
            icon={<Download size={14} aria-hidden />}
            onClick={() => runFromMenu(() => exportRef.current?.open())}
          >
            {exportLabel}
          </MenuItem>

          <MenuItem
            icon={<QrCode size={14} aria-hidden />}
            onClick={() => runFromMenu(() => bulkIssueRef.current?.open())}
          >
            Bulk issue QRs
          </MenuItem>

          {unsentQrs > 0 && (
            <MenuItem
              icon={<Mail size={14} aria-hidden />}
              onClick={() => runFromMenu(() => bulkEmailRef.current?.open())}
            >
              Email {unsentQrs} QR{unsentQrs === 1 ? "" : "s"}
            </MenuItem>
          )}

          {canDelete && (
            <>
              <div className="my-1 h-px bg-foreground/5" />
              <MenuItem
                destructive
                icon={<Trash2 size={14} aria-hidden />}
                onClick={() => runFromMenu(() => dangerRef.current?.open())}
              >
                Clear all members
              </MenuItem>
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
