"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Tier = "founder" | "senior" | "instructor" | "assistant";
type Status = "active" | "hidden" | "all";

const TEXT_DEBOUNCE_MS = 400;

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: "founder", label: "Founder" },
  { value: "senior", label: "Senior" },
  { value: "instructor", label: "Instructor" },
  { value: "assistant", label: "Assistant" },
];

// Same direct-URL navigation pattern as the other admin filters —
// no router, no submit, just window.location.href = newUrl.
function setParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.location.href = url.toString();
}

export function InstructorFilters({
  q,
  tier,
  status,
}: {
  q: string;
  tier: Tier | "";
  status: Status;
}) {
  const [text, setText] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setText(q);
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function onTextChange(value: string) {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setParam("q", value.trim()),
      TEXT_DEBOUNCE_MS,
    );
  }

  const hasFilter = !!q || !!tier || status !== "active";

  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-3"
      role="search"
      aria-label="Filter instructors"
    >
      <div className="relative h-10 min-w-[16rem] flex-1">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          name="q"
          type="search"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (debounceRef.current) clearTimeout(debounceRef.current);
              setParam("q", text.trim());
            }
          }}
          placeholder="Search by name"
          aria-label="Search instructors"
          className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <Pill label="Tier">
        <select
          name="tier"
          value={tier}
          onChange={(e) => setParam("tier", e.target.value)}
          className="bg-transparent text-sm focus:outline-none"
          aria-label="Filter by tier"
        >
          <option value="">All tiers</option>
          {TIER_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Pill>

      <Pill label="Status">
        <select
          name="status"
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="bg-transparent text-sm focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="all">All</option>
        </select>
      </Pill>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/instructors";
          }}
          className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} aria-hidden /> Reset
        </button>
      )}
    </div>
  );
}

function Pill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-full border border-input bg-background px-3">
      <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
