"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  MEMBER_LEVEL_LABELS,
  MEMBER_LEVEL_VALUES,
  MEMBER_STATUS_VALUES,
  memberStatusLabel,
  type MemberLevel,
  type MemberStatus,
} from "@/lib/format";

// onChange triggers router.replace inside a transition. No router.refresh
// (race condition) and no Apply button.

export function MemberFilters({
  level,
  status,
}: {
  level: MemberLevel | null;
  status: MemberStatus;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const baseParams = useMemo(() => params?.toString() ?? "", [params]);

  function navigateWith(key: string, value: string) {
    const next = new URLSearchParams(baseParams);
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    const url = qs ? `/admin/members?${qs}` : "/admin/members";
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }

  const hasFilter = !!level || status !== "active";

  return (
    <div
      className="mb-4 flex flex-wrap gap-3"
      role="search"
      aria-label="Filter members"
    >
      <Pill label="Level">
        <select
          value={level ?? ""}
          onChange={(e) => navigateWith("level", e.target.value)}
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
          value={status}
          onChange={(e) => navigateWith("status", e.target.value)}
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
              router.replace("/admin/members", { scroll: false });
            });
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
