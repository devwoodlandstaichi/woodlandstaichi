import type { ReactNode } from "react";
import { NewsHelpContent } from "./news-content";

// Registry of help topics. As new admin pages get help written, add an
// entry here. The shape is intentionally minimal — title + body — so
// the drawer and the standalone /admin/help/<topic> page can both
// render the same content without each plumbing different props.

export type HelpTopic = "news";

export type HelpEntry = {
  title: string;
  description: string;
  body: ReactNode;
  /** Path to the standalone help page so the drawer can offer "Open
   * full page" — useful when the founder wants to print or bookmark. */
  fullPageHref: string;
};

export const HELP_REGISTRY: Record<HelpTopic, HelpEntry> = {
  news: {
    title: "News",
    description: "Write, edit, hide, and delete stories for the school website.",
    body: <NewsHelpContent />,
    fullPageHref: "/admin/help/news",
  },
};
