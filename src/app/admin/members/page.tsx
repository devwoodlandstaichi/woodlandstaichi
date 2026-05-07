import { Card, PageHeader } from "@/components/admin/ui";
import { createClient } from "@/lib/supabase/server";
import {
  MEMBER_LEVEL_VALUES,
  MEMBER_STATUS_VALUES,
  type MemberLevel,
  type MemberStatus,
} from "@/lib/format";
import { MemberFilters } from "./filters";
import { DangerZoneButton } from "./danger-zone";
import { BulkIssueQrsButton } from "./bulk-issue-button";
import { BulkEmailQrsButton } from "./bulk-email-qrs-button";
import { getSessionUser } from "@/lib/auth/dal";
import { MembersTable } from "./members-table";
import {
  SORT_COLUMNS,
  type MemberRow,
  type SortColumn,
  type SortDir,
} from "./table-types";

export const metadata = { title: "Members" };
export const dynamic = "force-dynamic";

// Bump the timeout for server actions invoked from this page —
// bulk QR email serializes ~50 sends at ~600ms each. Vercel Hobby
// caps at 60s; we pin to that.
export const maxDuration = 60;

type SearchParams = Promise<{
  q?: string;
  level?: string;
  status?: string;
  sort?: string;
  dir?: string;
}>;

function isLevel(v: string | undefined): v is MemberLevel {
  return !!v && (MEMBER_LEVEL_VALUES as readonly string[]).includes(v);
}
function isStatus(v: string | undefined): v is MemberStatus {
  return !!v && (MEMBER_STATUS_VALUES as readonly string[]).includes(v);
}
function isSortColumn(v: string | undefined): v is SortColumn {
  return !!v && (SORT_COLUMNS as readonly string[]).includes(v);
}
function isSortDir(v: string | undefined): v is SortDir {
  return v === "asc" || v === "desc";
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const level = isLevel(params.level) ? params.level : null;
  const status = isStatus(params.status) ? params.status : "active";
  const sort: SortColumn = isSortColumn(params.sort) ? params.sort : "last_name";
  const dir: SortDir = isSortDir(params.dir) ? params.dir : "asc";

  const user = await getSessionUser();
  const supabase = await createClient();
  let query = supabase
    .from("members")
    .select(
      "id,first_name,last_name,nickname,email,phone,level,status,qr_token,created_at",
    );

  // Primary sort by the chosen column. For Name (last_name) we add a
  // first_name tiebreaker so families group cleanly. For everything
  // else, add last_name as a tiebreaker so equal categories still come
  // out alphabetical-by-name.
  const ascending = dir === "asc";
  if (sort === "last_name") {
    query = query
      .order("last_name", { ascending })
      .order("first_name", { ascending });
  } else {
    query = query
      .order(sort, { ascending })
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });
  }

  if (level) query = query.eq("level", level);
  if (status) query = query.eq("status", status);
  if (q) {
    // PostgREST ilike inside .or() needs `*` as the wildcard, not `%`.
    // Strip chars that would break the `or=(...)` group.
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(
      [
        `first_name.ilike.*${safe}*`,
        `last_name.ilike.*${safe}*`,
        `nickname.ilike.*${safe}*`,
        `email.ilike.*${safe}*`,
        `phone.ilike.*${safe}*`,
      ].join(","),
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as MemberRow[];

  // Count of members eligible for the bulk-email-unsent action so the
  // button can render the queue size in its label and hide entirely
  // when there's nothing to do.
  const { count: unsentQrs } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .not("qr_token", "is", null)
    .is("qr_emailed_at", null)
    .neq("status", "inactive")
    .not("email", "is", null);

  // Precompute the toggle URL for each sortable column so the (client)
  // table can render header links without needing the helper function.
  const sortHrefs = SORT_COLUMNS.reduce(
    (acc, column) => {
      const next = new URLSearchParams();
      if (q) next.set("q", q);
      if (level) next.set("level", level);
      if (status !== "active") next.set("status", status);
      next.set("sort", column);
      next.set(
        "dir",
        column === sort ? (dir === "asc" ? "desc" : "asc") : "asc",
      );
      acc[column] = `/admin/members?${next.toString()}`;
      return acc;
    },
    {} as Record<SortColumn, string>,
  );

  return (
    <>
      <PageHeader
        title="Members"
        description="Roster. Click a name to view details, edit, or change status."
        helpTopic="members"
        action={
          <>
            <BulkIssueQrsButton />
            <BulkEmailQrsButton unsentCount={unsentQrs ?? 0} />
            {user?.role === "admin" && <DangerZoneButton />}
          </>
        }
      />

      <MemberFilters q={q} level={level} status={status} />

      {rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          No members match these filters.
        </Card>
      ) : (
        <MembersTable
          rows={rows}
          sort={sort}
          dir={dir}
          sortHrefs={sortHrefs}
          canDelete={user?.role === "admin"}
        />
      )}

      <div className="-mx-4 shrink-0 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "member" : "members"}.
        </p>
      </div>
    </>
  );
}
