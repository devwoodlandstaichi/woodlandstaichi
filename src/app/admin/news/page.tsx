import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import {
  deletePost,
  publishPost,
  unpublishPost,
} from "./actions";
import { NewsFilters } from "./filters";

export const metadata = { title: "News" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  slug: string | null;
  posted_at: string;
  published: boolean;
  display_order: number;
  cover_image_url: string | null;
};

type Status = "all" | "published" | "draft";
type SearchParams = Promise<{ q?: string; status?: string }>;

function asStatus(v: string | undefined): Status {
  return v === "published" || v === "draft" ? v : "all";
}

export default async function NewsAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = asStatus(params.status);

  const supabase = await createClient();
  let query = supabase
    .from("news_posts")
    .select(
      "id,title,slug,posted_at,published,display_order,cover_image_url",
    )
    .order("posted_at", { ascending: false })
    .order("display_order", { ascending: true });

  if (status === "published") query = query.eq("published", true);
  else if (status === "draft") query = query.eq("published", false);

  if (q) {
    // PostgREST ilike inside .or() uses `*` as the wildcard. Strip chars
    // that would break the `or=(...)` group syntax.
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(
      [`title.ilike.*${safe}*`, `slug.ilike.*${safe}*`].join(","),
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const filtered = !!q || status !== "all";

  return (
    <>
      <PageHeader
        title="News"
        description="Announcements shown on the public /news page."
        action={
          <Link
            href="/admin/news/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> New post
          </Link>
        }
      />

      <NewsFilters q={q} status={status} />

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          {filtered ? "No posts match these filters." : "No posts yet."}
        </Card>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="sticky top-[129px] z-[5] bg-background text-xs uppercase tracking-[0.14em] text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Posted</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-foreground/5 last:border-0"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded border border-foreground/10 bg-secondary/40">
                      {p.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL
                        <img
                          src={p.cover_image_url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{p.title}</p>
                      {p.slug && (
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {p.slug}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDate(p.posted_at)}
                </td>
                <td className="px-4 py-4">
                  {p.published ? (
                    <Badge tone="jade">Published</Badge>
                  ) : (
                    <Badge tone="muted">Draft</Badge>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/news/${p.id}/edit`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
                    >
                      <Pencil size={14} aria-hidden /> Edit
                    </Link>
                    <form action={p.published ? unpublishPost : publishPost}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {p.published ? "Unpublish" : "Publish"}
                      </Button>
                    </form>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "post" : "posts"}.
        </p>
      </div>
    </>
  );
}
