import Link from "next/link";
import { CalendarPlus, Clock, Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { UserRowActions } from "./row-actions";
import {
  ROLE_FILTER_VALUES,
  SORT_COLUMN_VALUES,
  UserFilters,
  type RoleFilter,
  type SortColumn,
} from "./filters";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

type SortDir = "asc" | "desc";

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
  return !!v && (SORT_COLUMN_VALUES as readonly string[]).includes(v);
}
function isSortDir(v: string | undefined): v is SortDir {
  return v === "asc" || v === "desc";
}

function initialsOf(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return email[0]?.toUpperCase() ?? "·";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
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

      <UserFilters q={q} role={roleFilter} sort={sort} dir={dir} />

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
        <div className="min-h-0 flex-1 overflow-y-auto -mx-1 px-1 py-4">
          <ul
            role="list"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {sorted.map((u) => (
              <li key={u.id}>
                <UserCard user={u} isSelf={u.id === me.id} />
              </li>
            ))}
          </ul>
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

function UserCard({
  user,
  isSelf,
}: {
  user: {
    id: string;
    email: string;
    role: "admin" | "instructor" | null;
    created_at: string;
    last_sign_in_at: string | null;
  };
  isSelf: boolean;
}) {
  const lastSeen = user.last_sign_in_at
    ? formatDate(user.last_sign_in_at.slice(0, 10))
    : "Never";
  const joined = formatDate(user.created_at.slice(0, 10));

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md ${
        isSelf ? "border-vermillion/40 ring-1 ring-vermillion/20" : "border-foreground/10"
      }`}
    >
      {/* Identity strip: avatar circle + email + role badge.
          Top-right "(you)" chip appears on the current admin's own card
          so a destructive role flip on themselves is harder to do by
          accident. */}
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vermillion/10 font-display text-base font-medium tracking-tight text-vermillion">
          {initialsOf(user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" title={user.email}>
            {user.email}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {user.role === "admin" ? (
              <Badge tone="vermillion">Admin</Badge>
            ) : user.role === "instructor" ? (
              <Badge tone="cobalt">Instructor</Badge>
            ) : (
              <Badge tone="muted">No role</Badge>
            )}
            {isSelf && (
              <span className="inline-flex items-center rounded-full border border-vermillion/30 bg-vermillion/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-vermillion">
                you
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata block: Joined / Last seen. Mono digits so the dates
          line up vertically across cards in the grid. */}
      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-foreground/5 bg-secondary/30 px-5 py-4 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <CalendarPlus size={12} aria-hidden /> Joined
          </dt>
          <dd className="mt-1 font-mono text-xs tabular-nums text-foreground/85">
            {joined}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Clock size={12} aria-hidden /> Last seen
          </dt>
          <dd
            className={`mt-1 font-mono text-xs tabular-nums ${
              user.last_sign_in_at ? "text-foreground/85" : "text-muted-foreground"
            }`}
          >
            {lastSeen}
          </dd>
        </div>
      </dl>

      {/* Per-card actions. UserRowActions renders inline buttons; sized
          to fill the bottom strip so the card always ends with a clear
          action surface even if the metadata above is short. */}
      <div className="mt-auto border-t border-foreground/5 px-5 py-3">
        <div className="flex flex-wrap items-center justify-end gap-1.5 [&_button]:h-9 [&_a]:h-9">
          <UserRowActions
            userId={user.id}
            email={user.email}
            role={user.role}
            isSelf={isSelf}
          />
        </div>
      </div>
    </article>
  );
}
