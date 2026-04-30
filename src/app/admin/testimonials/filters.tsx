"use client";

import { X } from "lucide-react";

type Status = "all" | "pending" | "approved" | "rejected";

function setParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value && value !== "all") url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.location.href = url.toString();
}

export function TestimonialFilters({ status }: { status: Status }) {
  const hasFilter = status !== "all";
  return (
    <div
      className="-mx-4 flex shrink-0 flex-wrap items-center gap-3 border-b border-foreground/10 bg-background px-4 py-4 md:-mx-6 md:px-6"
      role="search"
      aria-label="Filter testimonials"
    >
      <Pill label="Status">
        <select
          name="status"
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="bg-transparent text-sm focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="all">All</option>
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </Pill>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/testimonials";
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
