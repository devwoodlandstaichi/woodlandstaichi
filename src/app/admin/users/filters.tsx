"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const TEXT_DEBOUNCE_MS = 400;

export type RoleFilter = "all" | "admin" | "instructor" | "none";
export const ROLE_FILTER_VALUES: readonly RoleFilter[] = [
  "all",
  "admin",
  "instructor",
  "none",
];

const ROLE_LABEL: Record<RoleFilter, string> = {
  all: "All roles",
  admin: "Admin",
  instructor: "Instructor",
  none: "No role",
};

function setParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.location.href = url.toString();
}

export function UserFilters({
  q,
  role,
}: {
  q: string;
  role: RoleFilter;
}) {
  const [text, setText] = useState(q);

  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setText(q);
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function onTextChange(value: string) {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setParam("q", value.trim()),
      TEXT_DEBOUNCE_MS,
    );
  }

  const hasFilter = !!q || role !== "all";

  return (
    <div
      className="-mx-4 flex shrink-0 flex-wrap items-center gap-3 border-b border-foreground/10 bg-background px-4 py-4 md:-mx-6 md:px-6"
      role="search"
      aria-label="Filter users"
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
          placeholder="Search by email"
          aria-label="Search users"
          className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </div>

      <Pill label="Role">
        <select
          name="role"
          value={role}
          onChange={(e) => setParam("role", e.target.value)}
          className="bg-transparent text-sm focus:outline-none"
          aria-label="Filter by role"
        >
          {ROLE_FILTER_VALUES.map((v) => (
            <option key={v} value={v}>
              {ROLE_LABEL[v]}
            </option>
          ))}
        </select>
      </Pill>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/users";
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
