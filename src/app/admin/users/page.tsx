import Link from "next/link";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { UserRowActions } from "./row-actions";
import {
  ROLE_FILTER_VALUES,
  UserFilters,
  type RoleFilter,
} from "./filters";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

const SORT_COLUMNS = [
  "email",
  "role",
  "created_at",
  "last_sign_in_at",
] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortColumn, string> = {
  email: "Email",
  role: "Role",
  created_at: "Created",
  last_sign_in_at: "Last sign-in",
};

// Order roles for the role-column sort: admin first, instructor next,
// no-role last. Matches the legacy default ordering.
const ROLE_RANK: Record<string, number> = {
  admin: 0,
  instructor: 1,
};
const NO_ROLE_RANK = 2;

type Row = {
  id: string;
  email: string;
  role: "admin" | "instructor" | null;
  created_at: string;
  last_sign_in_at: string | null;
};

type SearchParams = Promise<{
  q?: string;
  role?: string;
  sort?: string;
  dir?: string;
}>;

function isRoleFilter(v: string | undefined): v is RoleFilter {
  return !!v && (ROLE_FILTER_VALUES as readonly string[]).includes(v);
}
function isSortColumn(v: string | undefined): v is SortColumn {
  return !!v && (SORT_COLUMNS as readonly string[]).includes(v);
}
function isSortDir(v: string | undefined): v is SortDir {
  return v === "asc" || v === "desc";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const roleFilter: RoleFilter = isRoleFilter(params.role)
    ? params.role
    : "all";
  const sort: SortColumn = isSortColumn(params.sort) ? params.sort : "email";
  const dir: SortDir = isSortDir(params.dir) ? params.dir : "asc";

  const me = await requireAdmin();

  const admin = createAdminClient();
  const supabase = await createClient();

  // List users via the GoTrue admin API; left-join roles in JS. Filter
  // and sort happen in JS too — listUsers doesn't take query params.
  const { data: list, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("user_id, role");
  const roleByUser = new Map(
    (roleRows ?? []).map((r) => [r.user_id as string, r.role as string]),
  );

  const all: Row[] = (list?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    role: (roleByUser.get(u.id) as Row["role"]) ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));

  const qLower = q.toLowerCase();
  const filtered = all.filter((u) => {
    if (qLower && !u.email.toLowerCase().includes(qLower)) return false;
    if (roleFilter === "admin" && u.role !== "admin") return false;
    if (roleFilter === "instructor" && u.role !== "instructor") return false;
    if (roleFilter === "none" && u.role !== null) return false;
    return true;
  });

  const ascending = dir === "asc";
  const sorted = filtered.slice().sort((a, b) => {
    let cmp = 0;
    if (sort === "email") {
      cmp = a.email.localeCompare(b.email);
    } else if (sort === "role") {
      const ra = a.role ? ROLE_RANK[a.role] : NO_ROLE_RANK;
      const rb = b.role ? ROLE_RANK[b.role] : NO_ROLE_RANK;
      cmp = ra - rb || a.email.localeCompare(b.email);
    } else if (sort === "created_at") {
      cmp = a.created_at.localeCompare(b.created_at);
    } else if (sort === "last_sign_in_at") {
      // Never-signed-in (null) sorts last regardless of direction so they
      // don't dominate the top of a desc sort with all-zero dates.
      const an = a.last_sign_in_at;
      const bn = b.last_sign_in_at;
      if (an === null && bn === null) cmp = 0;
      else if (an === null) return 1;
      else if (bn === null) return -1;
      else cmp = an.localeCompare(bn);
    }
    if (cmp === 0) cmp = a.email.localeCompare(b.email);
    return ascending ? cmp : -cmp;
  });

  function sortHref(column: SortColumn): string {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (roleFilter !== "all") next.set("role", roleFilter);
    next.set("sort", column);
    next.set("dir", column === sort ? (dir === "asc" ? "desc" : "asc") : "asc");
    return `/admin/users?${next.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts that can sign in to /admin. Members don't appear here."
        action={
          <Link
            href="/admin/users/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> Invite user
          </Link>
        }
      />

      <UserFilters q={q} role={roleFilter} />

      {error && (
        <Card className="mt-4 border-destructive/30 bg-destructive/5 p-5 text-destructive">
          Couldn&apos;t load users: {error.message}
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          No users match these filters.
        </Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
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
                <th className="sticky top-0 z-[5] bg-background px-4 py-3 shadow-[inset_0_-1px_0_var(--border)]" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-foreground/5 last:border-0 align-top"
                  >
                    <td className="px-4 py-3 font-medium">
                      {u.email}
                      {isMe && (
                        <span className="ml-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <Badge tone="vermillion">Admin</Badge>
                      ) : u.role === "instructor" ? (
                        <Badge tone="cobalt">Instructor</Badge>
                      ) : (
                        <Badge tone="muted">No role</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(u.created_at.slice(0, 10))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.last_sign_in_at
                        ? formatDate(u.last_sign_in_at.slice(0, 10))
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <UserRowActions
                        userId={u.id}
                        email={u.email}
                        role={u.role}
                        isSelf={isMe}
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
          {sorted.length} {sorted.length === 1 ? "user" : "users"}.
        </p>
      </div>
    </>
  );
}
