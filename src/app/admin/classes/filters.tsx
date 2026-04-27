"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  CLASS_LEVEL_LABELS,
  CLASS_LEVEL_VALUES,
  DAY_OF_WEEK_VALUES,
  dayLabel,
} from "@/lib/format";

type Status = "active" | "archived" | "all";

const TEXT_DEBOUNCE_MS = 350;

// Filters are URL state. We use a real <form method="get"> as the
// source of truth and intercept submit to do a router.push (so it
// stays a SPA navigation), with a transition for smooth UI. On any
// failure path the form would still work via native browser submit.

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
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  // Controlled-ish text state for the search box, debounced.
  const [text, setText] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setText(q);
  }
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  function navigate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const sp = new URLSearchParams();
    fd.forEach((value, key) => {
      const v = String(value).trim();
      if (v) sp.set(key, v);
    });
    const qs = sp.toString();
    const url = qs ? `/admin/classes?${qs}` : "/admin/classes";
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  function onText(value: string) {
    setText(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(navigate, TEXT_DEBOUNCE_MS);
  }

  const hasFilter = q || level || day || status !== "active";

  return (
    <form
      ref={formRef}
      action="/admin/classes"
      method="get"
      onSubmit={(e) => {
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
          onChange={(e) => onText(e.target.value)}
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
          <button
            type="button"
            onClick={() => {
              setText("");
              startTransition(() => {
                router.push("/admin/classes", { scroll: false });
              });
            }}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <X size={14} aria-hidden /> Reset
          </button>
        )}
      </div>

      {/* Hidden submit so Enter in the search box still navigates;
          dropdowns submit immediately via onChange above. */}
      <button type="submit" className="hidden" aria-hidden tabIndex={-1}>
        Apply
      </button>
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
