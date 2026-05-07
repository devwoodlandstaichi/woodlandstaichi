import { PageHeader } from "@/components/admin/ui";
import { NewsHelpContent } from "@/components/admin/help/news-content";

export const metadata = { title: "Help — News" };

// Standalone "full page" presentation for the News help. Same content
// as the in-context drawer, just in a wider layout for printing /
// bookmarking / linking. Body lives in NewsHelpContent so the two
// presentations stay in sync.

export default function NewsHelpPage() {
  return (
    <>
      <PageHeader
        title="Help — News"
        description="Step-by-step instructions for adding and editing news posts."
        back={{ href: "/admin/help" }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-2 py-8 text-[19px] leading-[1.75] text-foreground/85">
          <NewsHelpContent />
        </div>
      </div>
    </>
  );
}
