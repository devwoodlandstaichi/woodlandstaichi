"use client";

import { X } from "lucide-react";

const PAYMENT_OPTIONS = ["pending", "paid", "waived", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_OPTIONS)[number];

// Same pattern as the other admin filters: direct URL mutation via
// window.location.href. No router, no form submit, no transitions.

function setParam(key: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.location.href = url.toString();
}

export function RegistrationFilters({ status }: { status: PaymentStatus }) {
  return (
    <div
      className="sticky top-16 z-10 -mx-4 flex flex-wrap items-center gap-3 border-b border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6"
      role="search"
      aria-label="Filter registrations"
    >
      <Pill label="Payment status">
        <select
          name="status"
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="bg-transparent text-sm focus:outline-none"
          aria-label="Filter by payment status"
        >
          {PAYMENT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Pill>

      {status !== "pending" && (
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin/registrations?status=pending";
          }}
          className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} aria-hidden /> Show pending
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
