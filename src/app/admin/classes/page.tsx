import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
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

type SearchParams = Promise<{
  q?: string;
  level?: string;
  day?: string;
  status?: string;
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
    // PostgREST `or` filter — quote commas/parens in values would need
    // escaping, but our search input is plain text.
    const escaped = q.replace(/[,)]/g, " ");
    query = query.or(`name.ilike.%${escaped}%,location.ilike.%${escaped}%`);
  }

  const { data } = await query.order("display_order", { ascending: true });
  const rows = (data ?? []) as ClassRow[];

  const sorted = rows.slice().sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.display_order !== b.display_order)
      return a.display_order - b.display_order;
    const dDiff = dayOrder(a.day_of_week) - dayOrder(b.day_of_week);
    if (dDiff !== 0) return dDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  const filtered = q || level || day || status !== "active";

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
        <Card className="p-8 text-center text-muted-foreground">
          {filtered
            ? "No classes match these filters."
            : "No classes yet. Create one to populate the public schedule."}
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Where</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-foreground/5 last:border-0"
                >
                  <td className="px-4 py-4 font-medium">{c.name}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {dayLabel(c.day_of_week)}
                    <br />
                    <span className="text-foreground">
                      {formatTimeRange(c.start_time, c.end_time)}
                    </span>
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
                      <form
                        action={c.active ? archiveClass : unarchiveClass}
                      >
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
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {sorted.length} {sorted.length === 1 ? "class" : "classes"}.
      </p>
    </>
  );
}
