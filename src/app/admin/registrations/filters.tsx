"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const PAYMENT_OPTIONS = ["pending", "paid", "waived", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_OPTIONS)[number];

export function RegistrationFilters({ status }: { status: PaymentStatus }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const baseParams = useMemo(() => params?.toString() ?? "", [params]);

  function navigateWith(value: string) {
    const next = new URLSearchParams(baseParams);
    if (value) next.set("status", value);
    else next.delete("status");
    const qs = next.toString();
    const url = qs ? `/admin/registrations?${qs}` : "/admin/registrations";
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }

  return (
    <div
      className="mb-4 flex flex-wrap gap-3"
      role="search"
      aria-label="Filter registrations"
    >
      <Pill label="Payment status">
        <select
          value={status}
          onChange={(e) => navigateWith(e.target.value)}
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
          onClick={() => navigateWith("pending")}
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
