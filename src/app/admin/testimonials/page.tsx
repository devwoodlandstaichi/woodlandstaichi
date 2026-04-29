import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  activateTestimonial,
  deactivateTestimonial,
  deleteTestimonial,
} from "./actions";

export const metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  member_name: string;
  attribution: string | null;
  quote: string;
  display_order: number;
  active: boolean;
};

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("id,member_name,attribution,quote,display_order,active")
    .order("active", { ascending: false })
    .order("display_order", { ascending: true });

  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Member quotes shown on the public About page."
        action={
          <Link
            href="/admin/testimonials/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> New testimonial
          </Link>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No testimonials yet.
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((t) => (
            <Card key={t.id} className="p-5">
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
                </div>
                <div className="flex items-center gap-2">
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
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-foreground/8 pt-4">
                <Link
                  href={`/admin/testimonials/${t.id}/edit`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
                >
                  <Pencil size={14} aria-hidden /> Edit
                </Link>
                <form
                  action={t.active ? deactivateTestimonial : activateTestimonial}
                >
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    {t.active ? "Hide" : "Show"}
                  </Button>
                </form>
                <form action={deleteTestimonial} className="ml-auto">
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
