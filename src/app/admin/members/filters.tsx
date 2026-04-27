"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  MEMBER_LEVEL_LABELS,
  MEMBER_LEVEL_VALUES,
  MEMBER_STATUS_VALUES,
  memberStatusLabel,
  type MemberLevel,
  type MemberStatus,
} from "@/lib/format";

// Real <form method="get"> as the source of truth. onChange on each
// dropdown submits the form, which we intercept and route via
// router.push inside a transition. Falls back to native browser form
// submission if anything goes wrong.

export function MemberFilters({
  level,
  status,
}: {
  level: MemberLevel | null;
  status: MemberStatus;
}) {
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
    const url = qs ? `/admin/members?${qs}` : "/admin/members";
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }

  const hasFilter = !!level || status !== "active";

  return (
    <form
      ref={formRef}
      action="/admin/members"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        navigate();
      }}
      className="mb-4 flex flex-wrap gap-3"
      role="search"
      aria-label="Filter members"
    >
      <Pill label="Level">
        <select
          name="level"
          defaultValue={level ?? ""}
          onChange={navigate}
          className="bg-transparent text-sm focus:outline-none"
          aria-label="Filter by level"
        >
          <option value="">All levels</option>
          {MEMBER_LEVEL_VALUES.map((v) => (
            <option key={v} value={v}>
              {MEMBER_LEVEL_LABELS[v]}
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
          {MEMBER_STATUS_VALUES.map((v) => (
            <option key={v} value={v}>
              {memberStatusLabel(v)}
            </option>
          ))}
        </select>
      </Pill>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.push("/admin/members", { scroll: false });
            });
          }}
          className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <X size={14} aria-hidden /> Reset
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
