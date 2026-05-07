"use client";

import { HelpCircle } from "lucide-react";
import { openHelpDrawer } from "./help-drawer";
import type { HelpTopic } from "./registry";

// PageHeader-mounted trigger that opens the help drawer. Rendered as
// the leftmost item in the action row so it lives in a predictable
// place across every admin page that has help — older users find
// "Help" by always-same location more reliably than by inline cues.
//
// Visual weight is lower than primary actions (ghost-ish) to avoid
// competing with task-specific buttons like "+ New post."

export function HelpTrigger({ topic }: { topic: HelpTopic }) {
  return (
    <button
      type="button"
      onClick={() => openHelpDrawer(topic)}
      title="How does this work?"
      className="
        inline-flex h-9 items-center gap-1.5 rounded-md px-2.5
        text-sm font-medium text-foreground/70
        transition-colors
        hover:bg-foreground/5 hover:text-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      "
    >
      <HelpCircle size={15} aria-hidden />
      Help
    </button>
  );
}
