import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import {
  HELP_REGISTRY,
  type HelpTopic,
} from "@/components/admin/help/registry";
import { getSessionUser } from "@/lib/auth/dal";

// Standalone "full page" presentation for any help topic. Same body
// renders inside the in-context drawer; this view exists for printing,
// bookmarking, or linking from outside the admin (e.g. an email to a
// new instructor saying "read this before your first day").

const VALID_TOPICS = Object.keys(HELP_REGISTRY) as HelpTopic[];

function isHelpTopic(v: string): v is HelpTopic {
  return (VALID_TOPICS as string[]).includes(v);
}

type Params = Promise<{ topic: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { topic } = await params;
  if (!isHelpTopic(topic)) return { title: "Help" };
  return { title: `Help — ${HELP_REGISTRY[topic].title}` };
}

export default async function HelpTopicPage({ params }: { params: Params }) {
  const { topic } = await params;
  if (!isHelpTopic(topic)) notFound();

  const entry = HELP_REGISTRY[topic];

  if (entry.adminOnly) {
    const user = await getSessionUser();
    if (user?.role !== "admin") notFound();
  }

  return (
    <>
      <PageHeader
        title={`Help — ${entry.title}`}
        description={entry.description}
        back={{ href: "/admin/help" }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-2 py-8 text-[19px] leading-[1.75] text-foreground/85">
          {entry.body}
        </div>
      </div>
    </>
  );
}
