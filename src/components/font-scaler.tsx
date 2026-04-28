"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Values are absolute base font-size in pixels. Plugs into globals.css
// via `font-size: calc(1px * var(--font-scale))`.
const STEPS = [
  { label: "A", value: 14, name: "Smaller text" },
  { label: "A+", value: 16, name: "Default text" },
  { label: "A++", value: 18, name: "Larger text" },
] as const;

const STORAGE_KEY = "wtc:font-scale";
const CHANGE_EVENT = "wtc:scale-change";

const DEFAULT_VALUE = 16;

function readScale(): number {
  if (typeof window === "undefined") return DEFAULT_VALUE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return !Number.isNaN(parsed) && STEPS.some((s) => s.value === parsed)
    ? parsed
    : DEFAULT_VALUE;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function FontScaler() {
  // useSyncExternalStore handles SSR + storage subscription cleanly,
  // avoiding setState-in-effect cascades.
  const scale = useSyncExternalStore(
    subscribe,
    readScale,
    () => DEFAULT_VALUE, // server snapshot
  );

  // Sync CSS variable to <html> whenever scale changes
  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(scale));
  }, [scale]);

  function apply(value: number) {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div
      className="inline-flex items-center gap-px rounded-full border border-foreground/15 bg-background/60 p-0.5 backdrop-blur-sm"
      role="group"
      aria-label="Adjust text size"
    >
      {STEPS.map((step) => {
        const active = scale === step.value;
        return (
          <button
            key={step.label}
            type="button"
            onClick={() => apply(step.value)}
            aria-label={step.name}
            aria-pressed={active}
            className={cn(
              "min-w-10 min-h-10 rounded-full px-2.5 text-sm font-medium transition-colors",
              "hover:bg-foreground/10",
              active && "bg-foreground text-background hover:bg-foreground",
            )}
          >
            <span aria-hidden>{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
