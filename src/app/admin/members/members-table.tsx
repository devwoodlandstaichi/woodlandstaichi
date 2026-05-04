"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Pencil,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/admin/ui";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";
import { useToast } from "@/components/admin/toast";
import { EmailQrButton } from "./email-qr-button";
import {
  bulkSetMemberLevel,
  bulkSetMemberStatus,
  deleteMembers,
} from "./actions";
import {
  MEMBER_LEVEL_LABELS,
  MEMBER_LEVEL_VALUES,
  memberStatusLabel,
  type MemberLevel,
  type MemberStatus,
} from "@/lib/format";
import {
  SORT_COLUMNS,
  type MemberRow,
  type SortColumn,
  type SortDir,
} from "./table-types";

const SORT_LABEL: Record<SortColumn, string> = {
  last_name: "Name",
  email: "Email",
  phone: "Phone",
  level: "Level",
  status: "Status",
};

const LEVEL_TONE: Record<
  MemberLevel,
  "vermillion" | "cobalt" | "jade" | "neutral"
> = {
  instructor: "vermillion",
  beginners: "neutral",
  intermediate: "cobalt",
  advanced: "jade",
};

const STATUS_TONE: Record<MemberStatus, "jade" | "cobalt" | "muted"> = {
  active: "jade",
  waitlist: "cobalt",
  inactive: "muted",
};

export function MembersTable({
  rows,
  sort,
  dir,
  sortHrefs,
  canDelete,
}: {
  rows: MemberRow[];
  sort: SortColumn;
  dir: SortDir;
  sortHrefs: Record<SortColumn, string>;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const deleteDialog = useConfirmDialog();
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    ids: string[];
  } | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  // Drop selection on rows that no longer exist (e.g. after delete or
  // filter change). Render-time derive instead of useEffect — see
  // CLAUDE.md §8a, the set-state-in-effect lint pattern.
  const rowsKey = rows.map((r) => r.id).join(",");
  const [lastRowsKey, setLastRowsKey] = useState(rowsKey);
  if (rowsKey !== lastRowsKey) {
    setLastRowsKey(rowsKey);
    if (selected.size > 0) {
      const validIds = new Set(rows.map((r) => r.id));
      const pruned = new Set(
        [...selected].filter((id) => validIds.has(id)),
      );
      if (pruned.size !== selected.size) setSelected(pruned);
    }
  }

  // Dismiss menu on Escape, click anywhere, or outside contextmenu. The
  // setTimeout defers binding so the right-click that opened the menu
  // doesn't immediately close it.
  useEffect(() => {
    if (!menu) return;
    const dismiss = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    const t = window.setTimeout(() => {
      window.addEventListener("click", dismiss);
      window.addEventListener("contextmenu", dismiss);
      window.addEventListener("scroll", dismiss, true);
      window.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("click", dismiss);
      window.removeEventListener("contextmenu", dismiss);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAnchor(id);
  }

  function selectOnly(id: string) {
    // Click a row that's already the sole selection → deselect. Click
    // a row when other rows are selected → replace selection with this
    // one (so a follow-up click can deselect it).
    if (selected.size === 1 && selected.has(id)) {
      setSelected(new Set());
      setAnchor(null);
      return;
    }
    setSelected(new Set([id]));
    setAnchor(id);
  }

  function selectRange(toId: string) {
    if (!anchor) return selectOnly(toId);
    const a = rows.findIndex((r) => r.id === anchor);
    const b = rows.findIndex((r) => r.id === toId);
    if (a < 0 || b < 0) return selectOnly(toId);
    const [lo, hi] = a < b ? [a, b] : [b, a];
    setSelected(new Set(rows.slice(lo, hi + 1).map((r) => r.id)));
  }

  function selectAllVisible(checked: boolean) {
    if (!checked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  function handleRowClick(e: ReactMouseEvent, id: string) {
    // Skip clicks that landed on an interactive child (link, button,
    // checkbox, label) so the row's selection toggle doesn't intercept
    // navigation / mailto: / send-QR / checkbox toggles.
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, label")) return;
    if (e.shiftKey) {
      // The shift+mousedown that starts a text range fires before this
      // click — clear whatever the browser highlighted so the visual
      // result is just the row selection, not selected text spanning
      // the range.
      window.getSelection()?.removeAllRanges();
      selectRange(id);
    } else if (e.metaKey || e.ctrlKey) {
      toggleOne(id);
    } else {
      selectOnly(id);
    }
  }

  // Suppress the browser's native shift-click text-range selection on
  // rows. Without this, shift+click highlights every cell of text from
  // anchor to target before our row handler fires. We only suppress
  // when shift is held — so a normal click-and-drag can still select
  // text inside a cell for copy/paste.
  function handleRowMouseDown(e: ReactMouseEvent) {
    if (e.shiftKey) {
      const target = e.target as HTMLElement;
      if (!target.closest("a, button, input, label")) {
        e.preventDefault();
      }
    }
  }

  function handleContextMenu(e: ReactMouseEvent, id: string) {
    e.preventDefault();
    let ids: string[];
    if (selected.has(id) && selected.size > 0) {
      ids = [...selected];
    } else {
      setSelected(new Set([id]));
      setAnchor(id);
      ids = [id];
    }
    setMenu({ x: e.clientX, y: e.clientY, ids });
  }

  function applyStatus(ids: string[], status: MemberStatus) {
    setMenu(null);
    startTransition(async () => {
      const r = await bulkSetMemberStatus(ids, status);
      if (r.ok) {
        toast({
          tone: "ok",
          title: `Marked ${r.updated} ${
            r.updated === 1 ? "member" : "members"
          } ${memberStatusLabel(status).toLowerCase()}`,
        });
        router.refresh();
      } else {
        toast({
          tone: "err",
          title: "Couldn't update status",
          description: r.message,
        });
      }
    });
  }

  function applyLevel(ids: string[], level: MemberLevel) {
    setMenu(null);
    startTransition(async () => {
      const r = await bulkSetMemberLevel(ids, level);
      if (r.ok) {
        toast({
          tone: "ok",
          title: `Set ${r.updated} ${
            r.updated === 1 ? "member" : "members"
          } to ${MEMBER_LEVEL_LABELS[level]}`,
        });
        router.refresh();
      } else {
        toast({
          tone: "err",
          title: "Couldn't update level",
          description: r.message,
        });
      }
    });
  }

  function askDelete(ids: string[]) {
    setMenu(null);
    setPendingDeleteIds(ids);
    deleteDialog.show();
  }

  function confirmDelete() {
    const ids = pendingDeleteIds;
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = await deleteMembers(ids);
      if (r.ok) {
        toast({
          tone: "ok",
          title: `Deleted ${r.deleted} member${r.deleted === 1 ? "" : "s"}`,
          description: "Cascaded to attendance + registrations.",
        });
        setSelected(new Set());
        setPendingDeleteIds([]);
        deleteDialog.close();
        router.refresh();
      } else {
        toast({
          tone: "err",
          title: "Couldn't delete",
          description: r.message,
        });
      }
    });
  }

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = !allChecked && rows.some((r) => selected.has(r.id));
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someChecked;
    }
  }, [someChecked]);

  const previewName =
    pendingDeleteIds.length === 1
      ? rows.find((r) => r.id === pendingDeleteIds[0])
      : null;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          {/* Sticky lives on each <th>, not <thead>, because <thead>+z-index
              doesn't reliably stack above <tbody> rows in tables. */}
          <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="sticky top-0 z-[5] w-10 bg-background px-3 py-3 shadow-[inset_0_-1px_0_var(--border)]">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border border-input"
                  checked={allChecked}
                  onChange={(e) => selectAllVisible(e.target.checked)}
                  aria-label="Select all visible members"
                />
              </th>
              {SORT_COLUMNS.map((col) => {
                const active = col === sort;
                return (
                  <th
                    key={col}
                    scope="col"
                    aria-sort={
                      active
                        ? dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]"
                  >
                    <a
                      href={sortHrefs[col]}
                      className={
                        active
                          ? "inline-flex items-center gap-1 text-foreground hover:text-vermillion"
                          : "inline-flex items-center gap-1 hover:text-foreground"
                      }
                    >
                      {SORT_LABEL[col]}
                      {active &&
                        (dir === "asc" ? (
                          <ChevronUp size={12} aria-hidden />
                        ) : (
                          <ChevronDown size={12} aria-hidden />
                        ))}
                    </a>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const isSel = selected.has(m.id);
              return (
                <tr
                  key={m.id}
                  onClick={(e) => handleRowClick(e, m.id)}
                  onMouseDown={handleRowMouseDown}
                  onContextMenu={(e) => handleContextMenu(e, m.id)}
                  aria-selected={isSel}
                  className={`cursor-default border-b border-foreground/5 last:border-0 ${
                    isSel ? "bg-vermillion/5" : "hover:bg-foreground/[0.02]"
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border border-input"
                      checked={isSel}
                      onChange={() => toggleOne(m.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          e.preventDefault();
                          selectRange(m.id);
                        }
                      }}
                      aria-label={`Select ${m.first_name} ${m.last_name}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="hover:text-vermillion"
                      >
                        {m.first_name} {m.last_name}
                      </Link>
                      <EmailQrButton
                        memberId={m.id}
                        memberName={`${m.first_name} ${m.last_name}`}
                        email={m.email}
                        hasQr={!!m.qr_token}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={LEVEL_TONE[m.level]}>
                      {MEMBER_LEVEL_LABELS[m.level]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[m.status]}>
                      {memberStatusLabel(m.status)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          ids={menu.ids}
          canDelete={canDelete}
          pending={pending}
          onStatus={(s) => applyStatus(menu.ids, s)}
          onLevel={(l) => applyLevel(menu.ids, l)}
          onDelete={() => askDelete(menu.ids)}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(o) => {
          deleteDialog.onOpenChange(o);
          if (!o) setPendingDeleteIds([]);
        }}
        title={
          pendingDeleteIds.length === 1
            ? "Delete this member?"
            : `Delete ${pendingDeleteIds.length} members?`
        }
        description={
          pendingDeleteIds.length === 1 && previewName ? (
            <>
              <p>
                <strong className="text-foreground">
                  {previewName.first_name} {previewName.last_name}
                </strong>{" "}
                will be permanently removed.
              </p>
              <p className="mt-2 text-foreground/60">
                Their attendance and registration history will be deleted along
                with the member. This cannot be undone.
              </p>
            </>
          ) : (
            <>
              <p>
                {pendingDeleteIds.length} members will be permanently removed.
              </p>
              <p className="mt-2 text-foreground/60">
                Their attendance and registration history will be deleted along
                with them. This cannot be undone.
              </p>
            </>
          )
        }
        confirmLabel={
          pendingDeleteIds.length === 1
            ? "Delete member"
            : `Delete ${pendingDeleteIds.length} members`
        }
        tone="destructive"
        pending={pending}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function ContextMenu({
  x,
  y,
  ids,
  canDelete,
  pending,
  onStatus,
  onLevel,
  onDelete,
}: {
  x: number;
  y: number;
  ids: string[];
  canDelete: boolean;
  pending: boolean;
  onStatus: (status: MemberStatus) => void;
  onLevel: (level: MemberLevel) => void;
  onDelete: () => void;
}) {
  const single = ids.length === 1 ? ids[0] : null;

  // Clamp to viewport so the menu doesn't open off-screen on right-edge clicks.
  const left = Math.min(x, window.innerWidth - 240);
  const top = Math.min(y, window.innerHeight - 280);

  return (
    <div
      role="menu"
      aria-label="Member actions"
      className="fixed z-50 min-w-[14rem] overflow-hidden rounded-xl border border-foreground/10 bg-card py-1 shadow-2xl"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <p className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {ids.length === 1 ? "Member" : `${ids.length} selected`}
      </p>

      {single && (
        <MenuLink href={`/admin/members/${single}/edit`} icon={<Pencil size={14} aria-hidden />}>
          Edit
        </MenuLink>
      )}

      <div className="my-1 h-px bg-foreground/5" />

      <MenuItem
        icon={<UserCheck size={14} aria-hidden />}
        onClick={() => onStatus("active")}
        disabled={pending}
      >
        Mark active
      </MenuItem>
      <MenuItem
        icon={<UserMinus size={14} aria-hidden />}
        onClick={() => onStatus("waitlist")}
        disabled={pending}
      >
        Move to waitlist
      </MenuItem>
      <MenuItem
        icon={<UserX size={14} aria-hidden />}
        onClick={() => onStatus("inactive")}
        disabled={pending}
      >
        Mark inactive
      </MenuItem>

      <div className="my-1 h-px bg-foreground/5" />
      <p className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Level
      </p>
      {MEMBER_LEVEL_VALUES.map((lvl) => (
        <MenuItem
          key={lvl}
          icon={<GraduationCap size={14} aria-hidden />}
          onClick={() => onLevel(lvl)}
          disabled={pending}
        >
          {MEMBER_LEVEL_LABELS[lvl]}
        </MenuItem>
      ))}

      {canDelete && (
        <>
          <div className="my-1 h-px bg-foreground/5" />
          <MenuItem
            icon={<Trash2 size={14} aria-hidden />}
            onClick={onDelete}
            disabled={pending}
            destructive
          >
            {ids.length === 1 ? "Delete member" : `Delete ${ids.length} members`}
          </MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  disabled,
  destructive,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-foreground/5"
      }`}
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </button>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-foreground/5"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </Link>
  );
}
