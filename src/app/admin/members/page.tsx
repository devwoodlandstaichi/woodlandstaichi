import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { EmailQrButton } from "./email-qr-button";
import {
  MEMBER_LEVEL_LABELS,
  MEMBER_LEVEL_VALUES,
  MEMBER_STATUS_VALUES,
  memberStatusLabel,
  type MemberLevel,
  type MemberStatus,
} from "@/lib/format";
import { MemberFilters } from "./filters";
import { DangerZone } from "./danger-zone";
import { BulkIssueQrsButton } from "./bulk-issue-button";
import { getSessionUser } from "@/lib/auth/dal";

export const metadata = { title: "Members" };
export const dynamic = "force-dynamic";

type MemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  level: MemberLevel;
  status: MemberStatus;
  qr_token: string | null;
  created_at: string;
};

const SORT_COLUMNS = ["last_name", "email", "phone", "level", "status"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortColumn, string> = {
  last_name: "Name",
  email: "Email",
  phone: "Phone",
  level: "Level",
  status: "Status",
};

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

const LEVEL_TONE: Record<MemberLevel, "vermillion" | "cobalt" | "jade" | "neutral"> = {
  instructor: "vermillion",
  beginners: "neutral",
  intermediate: "cobalt",
  advanced: "jade",
};

const STATUS_TONE: Record<MemberStatus, "jade" | "cobalt" | "muted"> = {
  active: "jade",
  waitlist: "cobalt",
  inactive: "muted",
};

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

  function sortHref(column: SortColumn): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (level) next.set("level", level);
    if (status !== "active") next.set("status", status);
    next.set("sort", column);
    // Click the active column to flip direction; click any other to start ascending.
    next.set("dir", column === sort ? (dir === "asc" ? "desc" : "asc") : "asc");
    return `/admin/members?${next.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Members"
        description="Roster. Click a name to view details, edit, or change status."
        action={<BulkIssueQrsButton />}
      />

      <MemberFilters q={q} level={level} status={status} />

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No members match these filters.
        </Card>
      ) : (
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
                    className="sticky top-[129px] z-[5] bg-background px-4 py-3 font-medium shadow-[inset_0_-1px_0_var(--border)]"
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
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.id}
                className="border-b border-foreground/5 last:border-0"
              >
                <td className="px-4 py-3 font-medium">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="hover:text-vermillion"
                    >
                      {m.last_name}, {m.first_name}
                    </Link>
                    <EmailQrButton
                      memberId={m.id}
                      memberName={`${m.first_name} ${m.last_name}`}
                      email={m.email}
                      hasQr={!!m.qr_token}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${m.email}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {m.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {m.phone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={LEVEL_TONE[m.level]}>
                    {MEMBER_LEVEL_LABELS[m.level]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[m.status]}>
                    {memberStatusLabel(m.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "member" : "members"}.
        </p>
      </div>

      {user?.role === "admin" && <DangerZone />}
    </>
  );
}
