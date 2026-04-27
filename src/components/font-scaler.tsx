"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "A", value: 1, name: "Default text size" },
  { label: "A+", value: 1.125, name: "Larger text" },
  { label: "A++", value: 1.25, name: "Largest text" },
] as const;

const STORAGE_KEY = "wtc:font-scale";
const CHANGE_EVENT = "wtc:scale-change";

function readScale(): number {
  if (typeof window === "undefined") return 1;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return !Number.isNaN(parsed) && STEPS.some((s) => s.value === parsed)
    ? parsed
    : 1;
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
    () => 1, // server snapshot
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
