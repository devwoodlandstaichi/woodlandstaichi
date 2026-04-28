"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  CLASS_LEVEL_LABELS,
  CLASS_LEVEL_VALUES,
  DAY_OF_WEEK_VALUES,
  dayLabel,
} from "@/lib/format";

type Status = "active" | "archived" | "all";

const TEXT_DEBOUNCE_MS = 400;

// Each filter input updates the URL directly via window.location.href.
// No router, no form submission, no React event-system handoff. The
// browser navigates to the new URL and the page renders fresh.
//
// We do NOT use Next's router.push here — it works with the
// allowedDevOrigins fix in next.config.ts, but we keep the bulletproof
// hard-navigation pattern for consistency across all admin filters.

function setParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.location.href = url.toString();
}

export function ClassFilters({
  q,
  level,
  day,
  status,
}: {
  q: string;
  level: string;
  day: string;
  status: Status;
}) {
  const [text, setText] = useState(q);

  // Sync text input to prop without useEffect.
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

  const hasFilter = !!q || !!level || !!day || status !== "active";

  return (
    <div
      className="sticky top-16 z-10 -mx-4 flex flex-wrap items-center gap-3 border-b border-foreground/10 bg-background px-4 pb-3 pt-7 md:-mx-6 md:px-6"
      role="search"
      aria-label="Filter classes"
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
          placeholder="Search by name or location"
          aria-label="Search classes"
          className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <Pill label="Level">
          <select
            name="level"
            value={level}
            onChange={(e) => setParam("level", e.target.value)}
            className="bg-transparent text-sm focus:outline-none"
            aria-label="Filter by level"
          >
            <option value="">All levels</option>
            {CLASS_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {CLASS_LEVEL_LABELS[v]}
              </option>
            ))}
          </select>
        </Pill>

        <Pill label="Day">
          <select
            name="day"
            value={day}
            onChange={(e) => setParam("day", e.target.value)}
            className="bg-transparent text-sm focus:outline-none"
            aria-label="Filter by day"
          >
            <option value="">Any day</option>
            {DAY_OF_WEEK_VALUES.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
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
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </Pill>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/classes";
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
