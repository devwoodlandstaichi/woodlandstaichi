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

// Filters navigate via window.location.assign — the most primitive form
// of navigation possible. Build the URL from current form values, then
// assign() to it. Browser does a hard navigation. Cannot fail.

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
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState(q);

  // Sync local text input to prop without useEffect.
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setText(q);
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function navigate() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const sp = new URLSearchParams();
    fd.forEach((value, key) => {
      const v = String(value).trim();
      if (v) sp.set(key, v);
    });
    const qs = sp.toString();
    const url = qs ? `/admin/classes?${qs}` : "/admin/classes";
    // window.location.assign forces a real browser navigation —
    // bypasses React, Next router, and any cache layers.
    window.location.assign(url);
  }

  function onTextChange(value: string) {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(navigate, TEXT_DEBOUNCE_MS);
  }

  const hasFilter = !!q || !!level || !!day || status !== "active";

  return (
    <form
      ref={formRef}
      action="/admin/classes"
      method="get"
      onSubmit={(e) => {
        // Pressing Enter in the search box submits the form natively;
        // intercept so we navigate the same way as onChange does.
        e.preventDefault();
        navigate();
      }}
      className="mb-4 flex flex-col gap-3"
      role="search"
      aria-label="Filter classes"
    >
      <div className="relative">
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
          placeholder="Search by name or location"
          aria-label="Search classes"
          className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Pill label="Level">
          <select
            name="level"
            defaultValue={level}
            onChange={navigate}
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
            defaultValue={day}
            onChange={navigate}
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
            defaultValue={status}
            onChange={navigate}
            className="bg-transparent text-sm focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </Pill>

        {hasFilter && (
          <a
            href="/admin/classes"
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <X size={14} aria-hidden /> Reset
          </a>
        )}
      </div>
    </form>
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
