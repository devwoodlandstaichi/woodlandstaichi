import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { NewsForm } from "../../post-form";
import { updatePost } from "../../actions";

export const metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select(
      "title,slug,body,posted_at,display_order,published,cover_image_url",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const action = updatePost.bind(null, id);

  return (
    <>
      <PageHeader
        title="Edit post"
        description={data.title}
        back="/admin/news"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <NewsForm
          action={action}
          defaults={data}
          submitLabel="Save changes"
          cancelHref="/admin/news"
        />
      </div>
    </>
  );
}
