import Link from "next/link";
import { Check, Pencil, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  activateTestimonial,
  approveTestimonial,
  deactivateTestimonial,
  deleteTestimonial,
  rejectTestimonial,
} from "./actions";
import { TestimonialFilters } from "./filters";

export const metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

type Status = "all" | "pending" | "approved" | "rejected";

type Row = {
  id: string;
  member_name: string;
  attribution: string | null;
  quote: string;
  display_order: number;
  active: boolean;
  status: "pending" | "approved" | "rejected";
  member_id: string | null;
  submitted_at: string | null;
  reviewer_note: string | null;
};

type SearchParams = Promise<{ status?: string }>;

const STATUS_BADGE: Record<
  Row["status"],
  { label: string; tone: "vermillion" | "jade" | "muted" }
> = {
  pending: { label: "Awaiting review", tone: "vermillion" },
  approved: { label: "Approved", tone: "jade" },
  rejected: { label: "Rejected", tone: "muted" },
};

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: Status =
    params.status === "pending"
      ? "pending"
      : params.status === "approved"
        ? "approved"
        : params.status === "rejected"
          ? "rejected"
          : "all";

  const supabase = await createClient();
  let q = supabase
    .from("testimonials")
    .select(
      "id,member_name,attribution,quote,display_order,active,status,member_id,submitted_at,reviewer_note",
    );
  if (status !== "all") q = q.eq("status", status);
  // Pending first, then by display order — keeps the queue at the top.
  q = q
    .order("status", { ascending: true })
    .order("active", { ascending: false })
    .order("display_order", { ascending: true });

  const { data } = await q;
  const rows = (data ?? []) as Row[];

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Testimonials"
        helpTopic="testimonials"
        description={
          status === "pending"
            ? "Member-submitted quotes awaiting your review."
            : "Member quotes shown on the public About page."
        }
        action={
          <Link
            href="/admin/testimonials/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> New testimonial
          </Link>
        }
      />

      <TestimonialFilters status={status} />

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
        {status === "all" && pendingCount > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-md border border-vermillion/30 bg-vermillion/5 px-4 py-3 text-sm">
            <span>
              <strong>{pendingCount}</strong>{" "}
              {pendingCount === 1 ? "submission is" : "submissions are"}{" "}
              awaiting review.
            </span>
            <Link
              href="/admin/testimonials?status=pending"
              className="font-medium text-vermillion hover:underline"
            >
              Review now →
            </Link>
          </div>
        )}

        {rows.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {status === "pending"
              ? "Nothing pending. The queue is clear."
              : "No testimonials yet."}
          </Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((t) => {
              const sb = STATUS_BADGE[t.status];
              const isPending = t.status === "pending";
              const isSelfSubmitted = !!t.member_id;
              return (
                <Card
                  key={t.id}
                  className={`p-5 ${isPending ? "border-vermillion/30" : ""}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <h2 className="font-display text-lg font-medium tracking-tight">
                        {t.member_name}
                      </h2>
                      {t.attribution && (
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
                          {t.attribution}
                        </p>
                      )}
                      {isSelfSubmitted && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Self-submitted
                          {t.submitted_at
                            ? ` · ${new Date(t.submitted_at).toLocaleDateString()}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={sb.tone}>{sb.label}</Badge>
                      {t.active ? (
                        <Badge tone="jade">Active</Badge>
                      ) : (
                        <Badge tone="muted">Hidden</Badge>
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums">
                        #{t.display_order}
                      </span>
                    </div>
                  </div>

                  <blockquote className="mt-4 text-sm text-foreground/85 leading-relaxed">
                    {t.quote}
                  </blockquote>

                  {t.reviewer_note && t.status === "rejected" && (
                    <p className="mt-3 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        Reviewer note:{" "}
                      </span>
                      {t.reviewer_note}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-foreground/8 pt-4">
                    {isPending && (
                      <>
                        <form action={approveTestimonial}>
                          <input type="hidden" name="id" value={t.id} />
                          <Button
                            type="submit"
                            size="sm"
                            className="inline-flex items-center gap-1.5"
                          >
                            <Check size={14} aria-hidden /> Approve
                          </Button>
                        </form>
                        <form action={rejectTestimonial}>
                          <input type="hidden" name="id" value={t.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="inline-flex items-center gap-1.5"
                          >
                            <X size={14} aria-hidden /> Reject
                          </Button>
                        </form>
                      </>
                    )}
                    <Link
                      href={`/admin/testimonials/${t.id}/edit`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
                    >
                      <Pencil size={14} aria-hidden /> Edit
                    </Link>
                    {!isPending && (
                      <form
                        action={
                          t.active ? deactivateTestimonial : activateTestimonial
                        }
                      >
                        <input type="hidden" name="id" value={t.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {t.active ? "Hide" : "Show"}
                        </Button>
                      </form>
                    )}
                    <form action={deleteTestimonial} className="ml-auto">
                      <input type="hidden" name="id" value={t.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
