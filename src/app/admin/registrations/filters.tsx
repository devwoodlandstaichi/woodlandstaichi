"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const PAYMENT_OPTIONS = ["pending", "paid", "waived", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_OPTIONS)[number];

export function RegistrationFilters({ status }: { status: PaymentStatus }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  function navigate() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const sp = new URLSearchParams();
    fd.forEach((value, key) => {
      const v = String(value).trim();
      if (v) sp.set(key, v);
    });
    const qs = sp.toString();
    const url = qs ? `/admin/registrations?${qs}` : "/admin/registrations";
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  return (
    <form
      ref={formRef}
      action="/admin/registrations"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        navigate();
      }}
      className="mb-4 flex flex-wrap gap-3"
      role="search"
      aria-label="Filter registrations"
    >
      <Pill label="Payment status">
        <select
          name="status"
          defaultValue={status}
          onChange={navigate}
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
            startTransition(() => {
              router.push("/admin/registrations?status=pending", {
                scroll: false,
              });
            });
          }}
          className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} aria-hidden /> Show pending
        </button>
      )}

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
