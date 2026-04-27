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
      />
      <NewsForm
        action={createPost}
        submitLabel="Publish post"
        cancelHref="/admin/news"
      />
    </>
  );
}
