"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { HELP_REGISTRY, type HelpTopic } from "./registry";

// Slide-out help drawer. Triggered by a "How does this work?" link in
// the admin PageHeader. Uses the native <dialog> element so we get
// focus-trap, Esc-to-close, and screen-reader semantics for free, with
// no extra dependencies. Animations are CSS-only.
//
// The triggering link is rendered separately by PageHeader; this file
// only owns the drawer surface itself, exposed through a small open()
// callback on a window-level event so the component tree doesn't have
// to thread refs around.

type HelpDrawerOpenEvent = CustomEvent<{ topic: HelpTopic }>;

export const HELP_DRAWER_EVENT = "wtc:open-help-drawer";

export function openHelpDrawer(topic: HelpTopic) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(HELP_DRAWER_EVENT, { detail: { topic } }),
  );
}

export function HelpDrawer() {
  const ref = useRef<HTMLDialogElement>(null);
  const [topic, setTopic] = useState<HelpTopic | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as HelpDrawerOpenEvent).detail;
      if (!detail?.topic) return;
      setTopic(detail.topic);
      const dlg = ref.current;
      if (dlg && !dlg.open) dlg.showModal();
    }
    window.addEventListener(HELP_DRAWER_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(
        HELP_DRAWER_EVENT,
        handler as EventListener,
      );
  }, []);

  // Close on backdrop click. <dialog> + showModal() makes the whole
  // viewport-minus-dialog area clickable on the dialog itself; clicks
  // landing on the dialog node (not bubbled from a child) are
  // backdrop clicks.
  function onClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) ref.current?.close();
  }

  function close() {
    ref.current?.close();
  }

  const entry = topic ? HELP_REGISTRY[topic] : null;

  return (
    <dialog
      ref={ref}
      onClick={onClick}
      aria-label={entry ? `Help — ${entry.title}` : "Help"}
      // Override the native <dialog> centered-rect default into a full-
      // height right-aligned panel. Backdrop comes from ::backdrop in
      // globals.css.
      className="
        m-0 ml-auto h-full w-full max-w-[520px] bg-background text-foreground
        p-0 outline-none
        [&::backdrop]:bg-black/40 [&::backdrop]:backdrop-blur-[2px]
      "
    >
      {entry && (
        <div className="flex h-full flex-col">
          {/* Header bar — sticky-feel via shrink-0 in the flex column */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-foreground/10 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.32em] text-foreground/55">
                Help
              </p>
              <h2 className="mt-0.5 truncate font-display text-xl tracking-tight">
                {entry.title}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={entry.fullPageHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                onClick={close}
                title="Open the full help page"
              >
                <ExternalLink size={14} aria-hidden />
                <span>Full page</span>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close help"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 text-[18px] leading-[1.7] text-foreground/85">
            {entry.body}
          </div>
        </div>
      )}
    </dialog>
  );
}
