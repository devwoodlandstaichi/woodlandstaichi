import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { NewsForm } from "../../post-form";
import { updatePost, type NewsFormState } from "../../actions";

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
    .select("title,slug,body,posted_at,display_order,published")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const action = (
    state: NewsFormState,
    formData: FormData,
  ): Promise<NewsFormState> => updatePost(id, state, formData);

  return (
    <>
      <PageHeader title="Edit post" description={data.title} />
      <NewsForm
        action={action}
        defaults={data}
        submitLabel="Save changes"
        cancelHref="/admin/news"
      />
    </>
  );
}
