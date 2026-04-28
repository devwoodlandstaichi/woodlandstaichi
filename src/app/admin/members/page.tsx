import Link from "next/link";
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

type SearchParams = Promise<{ q?: string; level?: string; status?: string }>;

function isLevel(v: string | undefined): v is MemberLevel {
  return !!v && (MEMBER_LEVEL_VALUES as readonly string[]).includes(v);
}
function isStatus(v: string | undefined): v is MemberStatus {
  return !!v && (MEMBER_STATUS_VALUES as readonly string[]).includes(v);
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

  const user = await getSessionUser();
  const supabase = await createClient();
  let query = supabase
    .from("members")
    .select(
      "id,first_name,last_name,nickname,email,phone,level,status,qr_token,created_at",
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

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
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Status</th>
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
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "member" : "members"}.
      </p>

      {user?.role === "admin" && <DangerZone />}
    </>
  );
}
