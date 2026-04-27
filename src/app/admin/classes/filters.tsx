"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  CLASS_LEVEL_LABELS,
  CLASS_LEVEL_VALUES,
  DAY_OF_WEEK_VALUES,
  dayLabel,
} from "@/lib/format";

type Status = "active" | "archived" | "all";

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
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/admin/classes?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const hasFilter = q || level || day || status !== "active";

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="relative">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or location"
          aria-label="Search classes"
          onChange={(e) => {
            const value = e.target.value;
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => setParam("q", value), 200);
          }}
          className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Pill label="Level">
          <select
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
            onClick={() => router.replace("/admin/classes", { scroll: false })}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <X size={14} aria-hidden /> Reset
          </button>
        )}
      </div>
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
