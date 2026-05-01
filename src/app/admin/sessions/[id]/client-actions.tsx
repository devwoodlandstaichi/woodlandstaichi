"use client";

import { useActionState } from "react";
import { Check, Mail, Power } from "lucide-react";
import { Button } from "@/components/admin/ui";
import {
  approveRsvp,
  sendApprovalRoster,
  sendRejectionRoster,
  toggleAcceptingRsvps,
  type ActionState,
  type RosterState,
} from "./actions";

/** Approve button + inline error/success surface. Wraps approveRsvp
 *  via useActionState so the capacity-guard error or any other DB
 *  failure shows up next to the button rather than silently no-op. */
export function ApproveButton({
  rsvpId,
  sessionId,
  disabled,
}: {
  rsvpId: string;
  sessionId: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    approveRsvp,
    undefined,
  );
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="id" value={rsvpId} />
        <input type="hidden" name="session_id" value={sessionId} />
        <Button
          type="submit"
          size="sm"
          disabled={disabled || pending}
          className="inline-flex items-center gap-1.5"
        >
          <Check size={14} aria-hidden />
          {pending ? "Approving…" : "Approve"}
        </Button>
      </form>
      {state && state.ok === false && (
        <p
          role="alert"
          className="max-w-[16rem] text-right text-xs text-vermillion"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

export function SendApprovalsButton({
  sessionId,
  unsentCount,
}: {
  sessionId: string;
  unsentCount: number;
}) {
  const [state, action, pending] = useActionState<RosterState, FormData>(
    sendApprovalRoster,
    undefined,
  );
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="session_id" value={sessionId} />
        <Button
          type="submit"
          size="sm"
          disabled={unsentCount === 0 || pending}
          className="inline-flex items-center gap-1.5"
        >
          <Mail size={14} aria-hidden />
          {pending
            ? "Sending…"
            : `Send approvals${unsentCount > 0 ? ` (${unsentCount})` : ""}`}
        </Button>
      </form>
      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`max-w-[16rem] text-right text-xs ${
            state.ok ? "text-jade" : "text-vermillion"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

export function SendRejectionsButton({
  sessionId,
  unsentCount,
}: {
  sessionId: string;
  unsentCount: number;
}) {
  const [state, action, pending] = useActionState<RosterState, FormData>(
    sendRejectionRoster,
    undefined,
  );
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="session_id" value={sessionId} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={unsentCount === 0 || pending}
          className="inline-flex items-center gap-1.5"
        >
          <Mail size={14} aria-hidden />
          {pending
            ? "Sending…"
            : `Send rejections${unsentCount > 0 ? ` (${unsentCount})` : ""}`}
        </Button>
      </form>
      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`max-w-[16rem] text-right text-xs ${
            state.ok ? "text-jade" : "text-vermillion"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

/** On/off pill for accepting_rsvps. Click flips the state via the
 *  server action and revalidates the page. */
export function AcceptingRsvpsToggle({
  sessionId,
  accepting,
}: {
  sessionId: string;
  accepting: boolean;
}) {
  return (
    <form action={toggleAcceptingRsvps}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="next" value={accepting ? "false" : "true"} />
      <button
        type="submit"
        aria-pressed={accepting}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium uppercase tracking-[0.16em] transition-colors ${
          accepting
            ? "border-jade/40 bg-jade/10 text-jade hover:bg-jade/15"
            : "border-foreground/20 bg-background text-foreground/65 hover:border-foreground/40 hover:text-foreground"
        }`}
      >
        <Power size={12} aria-hidden />
        {accepting ? "Accepting RSVPs" : "RSVPs closed"}
      </button>
    </form>
  );
}
