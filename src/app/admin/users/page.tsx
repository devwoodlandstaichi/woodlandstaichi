import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/dal";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { UserRowActions } from "./row-actions";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  email: string;
  role: "admin" | "instructor" | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export default async function UsersPage() {
  const me = await requireAdmin();

  const admin = createAdminClient();
  const supabase = await createClient();

  // List users via the admin API; left-join roles in JS.
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

  const rows: Row[] = (list?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "",
    role: (roleByUser.get(u.id) as Row["role"]) ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));

  // Sort: admins first, then instructors, then unrolled, then alpha
  rows.sort((a, b) => {
    const order = (r: Row["role"]) =>
      r === "admin" ? 0 : r === "instructor" ? 1 : 2;
    const d = order(a.role) - order(b.role);
    if (d !== 0) return d;
    return a.email.localeCompare(b.email);
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

      {error && (
        <Card className="p-5 mb-4 border-destructive/30 bg-destructive/5 text-destructive">
          Couldn&apos;t load users: {error.message}
        </Card>
      )}

      {rows.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No users yet.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
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
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "user" : "users"}.
      </p>
    </>
  );
}
