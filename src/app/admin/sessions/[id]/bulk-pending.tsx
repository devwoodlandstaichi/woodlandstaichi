"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Hourglass, X } from "lucide-react";
import { Badge, Button, Card } from "@/components/admin/ui";
import { formatDateTimeInSchoolTz, levelLabel } from "@/lib/format";
import {
  bulkApproveRsvps,
  bulkRejectRsvps,
  rejectRsvp,
  waitlistRsvp,
  type BulkActionState,
} from "./actions";
import { ApproveButton } from "./client-actions";

export type PendingRow = {
  id: string;
  requested_at: string;
  reviewer_note: string | null;
  notified_at: string | null;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    level: string;
  } | null;
  recentAttCount: number;
  registrationsCount: number;
};

/** Pending queue with multi-select + bulk Approve / Reject. Single-row
 *  actions still work via the inline buttons for ad-hoc decisions. */
export function PendingPanel({
  rows,
  sessionId,
  fullCapacity,
}: {
  rows: PendingRow[];
  sessionId: string;
  fullCapacity: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  const [approveState, approveAction, approvePending] = useActionState<
    BulkActionState,
    FormData
  >(bulkApproveRsvps, undefined);
  const [rejectState, rejectAction, rejectPending] = useActionState<
    BulkActionState,
    FormData
  >(bulkRejectRsvps, undefined);

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = selected.size > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }
  function clear() {
    setSelected(new Set());
    setRejectOpen(false);
    setNote("");
  }

  const selectedIds = Array.from(selected);

  return (
    <div className="grid gap-3">
      {/* Bulk action bar — only visible when rows are selected. */}
      {someSelected && (
        <Card className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-vermillion/30 bg-card/95 p-3 backdrop-blur">
          <p className="text-sm">
            <strong className="font-display text-base">
              {selected.size}
            </strong>{" "}
            selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {!rejectOpen && (
              <>
                <form action={approveAction}>
                  <input type="hidden" name="session_id" value={sessionId} />
                  {selectedIds.map((id) => (
                    <input key={id} type="hidden" name="id" value={id} />
                  ))}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={approvePending}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Check size={14} aria-hidden />
                    {approvePending ? "Approving…" : `Approve ${selected.size}`}
                  </Button>
                </form>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  className="inline-flex items-center gap-1.5 border-vermillion/40 text-vermillion hover:bg-vermillion/10"
                >
                  <X size={14} aria-hidden /> Reject {selected.size}
                </Button>
              </>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clear}
              disabled={approvePending || rejectPending}
            >
              Clear
            </Button>
          </div>

          {rejectOpen && (
            <form action={rejectAction} className="flex w-full flex-col gap-2">
              <input type="hidden" name="session_id" value={sessionId} />
              {selectedIds.map((id) => (
                <input key={id} type="hidden" name="id" value={id} />
              ))}
              <textarea
                name="reviewer_note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note — sent in the rejection email batch…"
                className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus-visible:border-vermillion focus-visible:outline-none"
              />
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRejectOpen(false);
                    setNote("");
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={rejectPending}
                  className="border-vermillion/40 text-vermillion hover:bg-vermillion/10"
                >
                  {rejectPending
                    ? "Rejecting…"
                    : `Confirm reject ${selected.size}`}
                </Button>
              </div>
            </form>
          )}

          {(approveState || rejectState) && (
            <p
              role="status"
              className={`w-full text-sm ${
                (approveState?.ok ?? rejectState?.ok) ? "text-jade" : "text-vermillion"
              }`}
            >
              {(approveState?.ok || rejectState?.ok)
                ? approveState?.ok
                  ? approveState.message
                  : rejectState?.ok
                    ? rejectState.message
                    : ""
                : approveState?.message || rejectState?.message}
            </p>
          )}
        </Card>
      )}

      {/* Header row: select-all */}
      {rows.length > 0 && (
        <label className="flex items-center gap-2 px-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 accent-vermillion"
          />
          Select all
        </label>
      )}

      {rows.map((r) => (
        <PendingRowCard
          key={r.id}
          row={r}
          sessionId={sessionId}
          fullCapacity={fullCapacity}
          selected={selected.has(r.id)}
          onToggle={() => toggle(r.id)}
        />
      ))}
    </div>
  );
}

function PendingRowCard({
  row,
  sessionId,
  fullCapacity,
  selected,
  onToggle,
}: {
  row: PendingRow;
  sessionId: string;
  fullCapacity: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const m = row.member;
  const memberName = m
    ? `${m.first_name} ${m.last_name}`.trim()
    : "(Unknown member)";

  return (
    <Card
      className={`p-4 md:p-5 transition-colors ${
        selected ? "border-vermillion/40 bg-vermillion/[0.03]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${memberName}`}
          className="mt-1.5 h-4 w-4 shrink-0 accent-vermillion"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-base font-medium tracking-tight">
                {m ? (
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="hover:text-vermillion"
                  >
                    {memberName}
                  </Link>
                ) : (
                  memberName
                )}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {m && (
                  <>
                    <Badge tone="muted">{levelLabel(m.level)}</Badge>
                    <span className="mx-2">·</span>
                    {m.email}
                    <span className="mx-2">·</span>
                  </>
                )}
                Requested {formatDateTimeInSchoolTz(row.requested_at)}
              </p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-foreground/55">
                <span className="font-mono tabular-nums text-foreground/85">
                  {row.recentAttCount}
                </span>{" "}
                scan{row.recentAttCount === 1 ? "" : "s"} · last 30d
                <span className="mx-2">·</span>
                <span className="font-mono tabular-nums text-foreground/85">
                  {row.registrationsCount}
                </span>{" "}
                registration{row.registrationsCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-wrap items-start gap-2">
              <ApproveButton
                rsvpId={row.id}
                sessionId={sessionId}
                disabled={fullCapacity}
              />
              <form action={waitlistRsvp}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="session_id" value={sessionId} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-1.5"
                >
                  <Hourglass size={14} aria-hidden />
                  Waitlist
                </Button>
              </form>
              <details className="group">
                <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-md border border-vermillion/40 bg-background px-3 text-sm text-vermillion hover:bg-vermillion/10 hover:border-vermillion">
                  <X size={14} aria-hidden /> Reject…
                </summary>
                <form
                  action={rejectRsvp}
                  className="mt-3 flex flex-col gap-2 md:w-72"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="session_id" value={sessionId} />
                  <textarea
                    name="reviewer_note"
                    rows={3}
                    placeholder="Optional note (sent in the rejection email batch)…"
                    className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm focus-visible:border-vermillion focus-visible:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="self-end"
                  >
                    Confirm reject
                  </Button>
                </form>
              </details>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
