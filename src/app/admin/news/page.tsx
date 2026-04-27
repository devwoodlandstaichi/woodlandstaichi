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

export const metadata = { title: "News" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  slug: string | null;
  posted_at: string;
  published: boolean;
  display_order: number;
};

export default async function NewsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("id,title,slug,posted_at,published,display_order")
    .order("posted_at", { ascending: false })
    .order("display_order", { ascending: true });

  const rows = (data ?? []) as Row[];

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

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No posts yet.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
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
                    <p className="font-medium">{p.title}</p>
                    {p.slug && (
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {p.slug}
                      </p>
                    )}
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
        </Card>
      )}
    </>
  );
}
