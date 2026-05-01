import Link from "next/link";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, PageHeader } from "@/components/admin/ui";
import { approveReactivation } from "./actions";
import { RejectButton } from "./reject-button";

export const metadata = { title: "Reactivation requests" };
export const dynamic = "force-dynamic";

type Status = "pending" | "approved" | "rejected" | "all";

type RequestRow = {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
  reviewer_note: string | null;
  members: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  } | null;
};

const STATUS_BADGE: Record<
  RequestRow["status"],
  { label: string; tone: "vermillion" | "jade" | "muted" }
> = {
  pending: { label: "Awaiting review", tone: "vermillion" },
  approved: { label: "Approved", tone: "jade" },
  rejected: { label: "Rejected", tone: "muted" },
};

type SearchParams = Promise<{ status?: string }>;

export default async function ReactivationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: Status =
    params.status === "approved"
      ? "approved"
      : params.status === "rejected"
        ? "rejected"
        : params.status === "all"
          ? "all"
          : "pending";

  const supabase = await createClient();
  let q = supabase
    .from("member_reactivation_requests")
    .select(
      "id, email, status, requested_at, reviewed_at, reviewer_note, members:member_id(id, first_name, last_name, email, status)",
    );
  if (status !== "all") q = q.eq("status", status);
  q = q
    .order("status", { ascending: true })
    .order("requested_at", { ascending: false });

  const { data } = await q;
  const rows = (data ?? []) as unknown as RequestRow[];

  return (
    <>
      <PageHeader
        title="Reactivation requests"
        description={
          status === "pending"
            ? "Returning players asking to come back. Approve to flip them to active and email them the news."
            : "Returning-player requests submitted via the public form."
        }
      />

      <div className="-mx-4 flex shrink-0 flex-wrap items-center gap-3 border-b border-foreground/10 bg-background px-4 py-4 md:-mx-6 md:px-6">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => {
          const active = status === s;
          return (
            <Link
              key={s}
              href={
                s === "pending"
                  ? "/admin/reactivations"
                  : `/admin/reactivations?status=${s}`
              }
              className={
                active
                  ? "inline-flex h-9 items-center rounded-full bg-foreground px-4 text-xs font-medium uppercase tracking-[0.16em] text-background"
                  : "inline-flex h-9 items-center rounded-full border border-foreground/15 px-4 text-xs uppercase tracking-[0.16em] text-foreground/65 hover:text-foreground hover:border-foreground/30"
              }
            >
              {s}
            </Link>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        {rows.length === 0 ? (
          <p className="px-1 py-12 text-center text-sm text-muted-foreground">
            {status === "pending"
              ? "No requests in the queue. Empty as it should be."
              : "No requests match this filter."}
          </p>
        ) : (
          <div className="grid gap-4">
            {rows.map((r) => {
              const m = r.members;
              const memberName = m
                ? `${m.first_name} ${m.last_name}`.trim()
                : r.email;
              const sb = STATUS_BADGE[r.status];
              const isPending = r.status === "pending";
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border bg-card p-5 ${
                    isPending ? "border-vermillion/30" : "border-foreground/10"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-medium tracking-tight">
                        {m ? (
                          <Link
                            href={`/admin/members/${m.id}/edit`}
                            className="hover:text-vermillion"
                          >
                            {memberName}
                          </Link>
                        ) : (
                          memberName
                        )}
                      </h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.email} ·{" "}
                        Requested{" "}
                        {new Date(r.requested_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {m && (
                          <>
                            {" "}
                            · Member status:{" "}
                            <span className="font-medium">{m.status}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Badge tone={sb.tone}>{sb.label}</Badge>
                  </div>

                  {r.reviewer_note && r.status === "rejected" && (
                    <p className="mt-3 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        Reviewer note:{" "}
                      </span>
                      {r.reviewer_note}
                    </p>
                  )}

                  {isPending && (
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-foreground/8 pt-4">
                      <form action={approveReactivation}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button
                          type="submit"
                          size="sm"
                          className="inline-flex items-center gap-1.5"
                        >
                          <Check size={14} aria-hidden /> Approve & email
                        </Button>
                      </form>
                      <RejectButton id={r.id} memberName={memberName} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
