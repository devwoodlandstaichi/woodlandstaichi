import Link from "next/link";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  CLASS_LEVEL_VALUES,
  formatDate,
  formatTimeRange,
  levelLabel,
  type ClassLevel,
} from "@/lib/format";
import { GenerateTermButton } from "./generate-term-button";
import { BulkDeleteButton } from "./bulk-delete-button";
import { DeleteSessionButton } from "./delete-session-button";
import { toggleNewcomerFriendly } from "./actions";
import { CapacityInput } from "./capacity-input";
import { SessionFilters } from "./filters";
import {
  SESSION_PERIOD_VALUES,
  type SessionPeriod,
} from "./filter-types";
import { getSessionUser } from "@/lib/auth/dal";

export const metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

const SORT_COLUMNS = ["session_date"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortColumn, string> = {
  session_date: "When",
};

type SessionRow = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  newcomer_friendly: boolean;
  capacity: number | null;
  classes: {
    name: string;
    level: ClassLevel;
    location: string;
    capacity: number | null;
  } | null;
  attendance: { count: number }[] | null;
};

type SearchParams = Promise<{
  q?: string;
  level?: string;
  period?: string;
  sort?: string;
  dir?: string;
}>;

function isLevel(v: string | undefined): v is ClassLevel {
  return !!v && (CLASS_LEVEL_VALUES as readonly string[]).includes(v);
}
function isPeriod(v: string | undefined): v is SessionPeriod {
  return !!v && (SESSION_PERIOD_VALUES as readonly string[]).includes(v);
}
function isSortColumn(v: string | undefined): v is SortColumn {
  return !!v && (SORT_COLUMNS as readonly string[]).includes(v);
}
function isSortDir(v: string | undefined): v is SortDir {
  return v === "asc" || v === "desc";
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const level = isLevel(params.level) ? params.level : null;
  const period: SessionPeriod = isPeriod(params.period)
    ? params.period
    : "upcoming";
  const sort: SortColumn = isSortColumn(params.sort)
    ? params.sort
    : "session_date";
  // Past defaults to newest-first, everything else oldest-first.
  const defaultDir: SortDir = period === "past" ? "desc" : "asc";
  const dir: SortDir = isSortDir(params.dir) ? params.dir : defaultDir;

  const me = await getSessionUser();
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  // !inner on classes turns the embed into an inner join so filters on
  // classes.* propagate as constraints, not column-visibility filters.
  let query = supabase
    .from("class_sessions")
    .select(
      "id,session_date,start_time,end_time,newcomer_friendly,capacity,classes!inner(name,level,location,capacity),attendance(count)",
    );

  if (period === "upcoming") query = query.gte("session_date", todayIso);
  else if (period === "past") query = query.lt("session_date", todayIso);

  if (level) query = query.eq("classes.level", level);

  if (q) {
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(
      [`name.ilike.*${safe}*`, `location.ilike.*${safe}*`].join(","),
      { referencedTable: "classes" },
    );
  }

  const ascending = dir === "asc";
  query = query
    .order("session_date", { ascending })
    .order("start_time", { ascending });

  query = query.limit(500);

  const { data } = await query;
  const rows = (data ?? []) as unknown as SessionRow[];

  function sortHref(column: SortColumn): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (level) next.set("level", level);
    if (period !== "upcoming") next.set("period", period);
    next.set("sort", column);
    next.set("dir", column === sort ? (dir === "asc" ? "desc" : "asc") : "asc");
    return `/admin/sessions?${next.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Sessions"
        description="Specific class occurrences on a date. Attendance writes against these rows."
        action={
          <>
            <GenerateTermButton />
            {me?.role === "admin" && <BulkDeleteButton />}
          </>
        }
      />

      <SessionFilters q={q} level={level} period={period} />

      {rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          No sessions match these filters.
        </Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <table className="w-full text-left text-sm">
            {/* Sticky lives on each <th>, not <thead>, because <thead>+z-index
                doesn't reliably stack above <tbody> rows in tables. */}
            <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                {SORT_COLUMNS.map((col) => {
                  const active = col === sort;
                  return (
                    <th
                      key={col}
                      scope="col"
                      aria-sort={
                        active
                          ? dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]"
                    >
                      <a
                        href={sortHref(col)}
                        className={
                          active
                            ? "inline-flex items-center gap-1 text-foreground hover:text-vermillion"
                            : "inline-flex items-center gap-1 hover:text-foreground"
                        }
                      >
                        {SORT_LABEL[col]}
                        {active &&
                          (dir === "asc" ? (
                            <ChevronUp size={12} aria-hidden />
                          ) : (
                            <ChevronDown size={12} aria-hidden />
                          ))}
                      </a>
                    </th>
                  );
                })}
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">
                  Class
                </th>
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">
                  Where
                </th>
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">
                  Level
                </th>
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">
                  Capacity
                </th>
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">
                  Newcomers
                </th>
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]">
                  Scans
                </th>
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 shadow-[inset_0_-1px_0_var(--border)]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const scans = s.attendance?.[0]?.count ?? 0;
                const className = `${s.classes?.name ?? "—"} · ${formatDate(
                  s.session_date,
                )} · ${formatTimeRange(s.start_time, s.end_time)}`;
                return (
                  <tr
                    key={s.id}
                    className="border-b border-foreground/5 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/sessions/${s.id}`}
                        className="block hover:text-vermillion"
                      >
                        <p className="font-medium underline-offset-4 hover:underline">
                          {formatDate(s.session_date)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatTimeRange(s.start_time, s.end_time)}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{s.classes?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.classes?.location ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.classes?.level && (
                        <Badge tone="cobalt">
                          {levelLabel(s.classes.level)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CapacityInput
                        sessionId={s.id}
                        capacity={s.capacity}
                        classCapacity={s.classes?.capacity ?? null}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleNewcomerFriendly}>
                        <input type="hidden" name="id" value={s.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={s.newcomer_friendly ? "false" : "true"}
                        />
                        {s.newcomer_friendly ? (
                          <button
                            type="submit"
                            aria-label="Remove newcomer-friendly tag"
                            className="inline-flex items-center gap-1.5 rounded-full border border-vermillion/30 bg-vermillion/8 px-3 py-1 text-xs font-medium text-vermillion hover:bg-vermillion/15 transition-colors"
                          >
                            <Sparkles size={12} aria-hidden /> Welcoming
                          </button>
                        ) : (
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="inline-flex items-center gap-1.5"
                          >
                            <Sparkles size={12} aria-hidden /> Mark welcoming
                          </Button>
                        )}
                      </form>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums text-muted-foreground">
                      {scans}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteSessionButton
                        sessionId={s.id}
                        className={className}
                        attendanceCount={scans}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="-mx-4 shrink-0 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "session" : "sessions"}.
        </p>
      </div>
    </>
  );
}
