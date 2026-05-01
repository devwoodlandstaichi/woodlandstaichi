import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Badge,
  Button,
  Card,
  PageHeader,
} from "@/components/admin/ui";
import {
  CLASS_LEVEL_VALUES,
  DAY_OF_WEEK_VALUES,
  dayLabel,
  dayOrder,
  formatTimeRange,
  levelLabel,
} from "@/lib/format";
import { archiveClass, unarchiveClass } from "./actions";
import { ClassFilters } from "./filters";
import { DeleteClassButton } from "./delete-class-button";

export const metadata = { title: "Classes" };
export const dynamic = "force-dynamic";

type ClassRow = {
  id: string;
  name: string;
  level: string;
  location: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
  active: boolean;
  display_order: number;
};

type Status = "active" | "archived" | "all";

function asStatus(v: string | undefined): Status {
  return v === "archived" || v === "all" ? v : "active";
}

// "schedule" sorts by day-of-week then start-time — i.e. the way a
// student reading the public schedule expects classes ordered. Default
// (no sort param) keeps the curated display_order admins set manually
// with archived rows pushed to the bottom.
const SORT_COLUMNS = ["schedule", "location", "level", "status"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortColumn, string> = {
  schedule: "Class",
  location: "Where",
  level: "Level",
  status: "Status",
};

const LEVEL_ORDER: Record<string, number> = {
  beginners: 1,
  intermediate: 2,
  advanced: 3,
  remedial: 4,
  play_only: 5,
  combined: 6,
};

function isSortColumn(v: string | undefined): v is SortColumn {
  return !!v && (SORT_COLUMNS as readonly string[]).includes(v);
}
function isSortDir(v: string | undefined): v is SortDir {
  return v === "asc" || v === "desc";
}

type SearchParams = Promise<{
  q?: string;
  level?: string;
  day?: string;
  status?: string;
  sort?: string;
  dir?: string;
}>;

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const level =
    params.level && (CLASS_LEVEL_VALUES as readonly string[]).includes(params.level)
      ? params.level
      : "";
  const day =
    params.day && (DAY_OF_WEEK_VALUES as readonly string[]).includes(params.day)
      ? params.day
      : "";
  const status = asStatus(params.status);
  const sort: SortColumn | null = isSortColumn(params.sort) ? params.sort : null;
  const dir: SortDir = isSortDir(params.dir) ? params.dir : "asc";

  const supabase = await createClient();
  let query = supabase
    .from("classes")
    .select(
      "id,name,level,location,day_of_week,start_time,end_time,capacity,active,display_order",
    );

  if (status === "active") query = query.eq("active", true);
  else if (status === "archived") query = query.eq("active", false);
  if (level) query = query.eq("level", level);
  if (day) query = query.eq("day_of_week", day);
  if (q) {
    // PostgREST URL syntax for ilike uses `*` as the wildcard, not `%`,
    // when the filter string is passed via `.or()`. Strip commas, parens,
    // and asterisks so they don't break the `or=(...)` group.
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(`name.ilike.*${safe}*,location.ilike.*${safe}*`);
  }

  const { data } = await query.order("display_order", { ascending: true });
  const rows = (data ?? []) as ClassRow[];

  // Default sort (no `sort` param): active rows first, then by curated
  // display_order, then by day + time. This is the order admins authored
  // for the public schedule and we want to keep it as the resting state.
  // Explicit clicks on a column header override with that column's sort.
  const ascending = dir === "asc";
  const sorted = rows.slice().sort((a, b) => {
    let cmp = 0;
    if (sort === "schedule") {
      cmp =
        dayOrder(a.day_of_week) - dayOrder(b.day_of_week) ||
        a.start_time.localeCompare(b.start_time);
    } else if (sort === "location") {
      cmp = a.location.localeCompare(b.location);
    } else if (sort === "level") {
      cmp = (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
    } else if (sort === "status") {
      // active=true sorts before active=false in asc, after in desc
      cmp = a.active === b.active ? 0 : a.active ? -1 : 1;
    } else {
      // No explicit sort — default ordering.
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (a.display_order !== b.display_order)
        return a.display_order - b.display_order;
      cmp =
        dayOrder(a.day_of_week) - dayOrder(b.day_of_week) ||
        a.start_time.localeCompare(b.start_time);
      return cmp; // skip the asc/desc flip — default is always ascending
    }
    // Tiebreaker so equal categories stay schedule-ordered.
    if (cmp === 0) {
      cmp =
        dayOrder(a.day_of_week) - dayOrder(b.day_of_week) ||
        a.start_time.localeCompare(b.start_time);
    }
    return ascending ? cmp : -cmp;
  });

  const filtered = q || level || day || status !== "active";

  function sortHref(column: SortColumn): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (level) next.set("level", level);
    if (day) next.set("day", day);
    if (status !== "active") next.set("status", status);
    next.set("sort", column);
    next.set(
      "dir",
      column === sort ? (dir === "asc" ? "desc" : "asc") : "asc",
    );
    return `/admin/classes?${next.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Classes"
        description="Recurring class definitions. Edits show on the public schedule immediately."
        action={
          <Link
            href="/admin/classes/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus size={16} aria-hidden /> New class
          </Link>
        }
      />

      <ClassFilters q={q} level={level} day={day} status={status} />

      {sorted.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          {filtered
            ? "No classes match these filters."
            : "No classes yet. Create one to populate the public schedule."}
        </Card>
      ) : (
        // Scroll container — only the table body scrolls. min-h-0 is
        // required so this flex child can actually shrink below content
        // height; without it the parent's overflow:hidden has no effect.
        // No negative bleed margin here: <main> has overflow:hidden so
        // any horizontal extension would clip the leftmost column.
        <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          {/* Sticky thead pins inside this scroll container at top:0
              (relative to the container), so the column headers stay
              visible while only rows scroll. Per-<th> sticky avoids the
              <thead>+z-index bleed-through problem. */}
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
                    className={
                      col === "schedule"
                        ? "sticky top-0 z-[5] min-w-[18rem] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]"
                        : "sticky top-0 z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]"
                    }
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
              <th className="sticky top-0 z-[5] bg-background px-4 py-3 shadow-[inset_0_-1px_0_var(--border)]" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className="border-b border-foreground/5 last:border-0"
              >
                <td className="min-w-[18rem] px-4 py-4">
                  <p className="font-medium">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {dayLabel(c.day_of_week)}
                    <span className="mx-1.5 text-foreground/30">·</span>
                    <span className="font-mono tabular-nums text-foreground/85">
                      {formatTimeRange(c.start_time, c.end_time)}
                    </span>
                  </p>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {c.location}
                </td>
                <td className="px-4 py-4">
                  <Badge tone="cobalt">{levelLabel(c.level)}</Badge>
                </td>
                <td className="px-4 py-4">
                  {c.active ? (
                    <Badge tone="jade">Active</Badge>
                  ) : (
                    <Badge tone="muted">Archived</Badge>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/classes/${c.id}/edit`}
                      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Pencil size={14} aria-hidden /> Edit
                    </Link>
                    <form action={c.active ? archiveClass : unarchiveClass}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        aria-label={
                          c.active
                            ? `Archive ${c.name}`
                            : `Unarchive ${c.name}`
                        }
                      >
                        {c.active ? "Archive" : "Unarchive"}
                      </Button>
                    </form>
                    <DeleteClassButton id={c.id} name={c.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div className="-mx-4 shrink-0 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "class" : "classes"}.
        </p>
      </div>
    </>
  );
}
