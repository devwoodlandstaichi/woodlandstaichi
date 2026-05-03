import { PageHeader } from "@/components/admin/ui";
import { NewsForm } from "../post-form";
import { createPost } from "../actions";

export const metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <>
      <PageHeader
        title="New post"
        description="Announcements appear on /news, newest first."
        back="/admin/news"
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <NewsForm
          action={createPost}
          submitLabel="Publish post"
          cancelHref="/admin/news"
        />
      </div>
    </>
  );
}
