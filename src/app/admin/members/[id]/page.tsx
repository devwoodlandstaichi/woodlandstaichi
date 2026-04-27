import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  MEMBER_LEVEL_LABELS,
  memberStatusLabel,
  type MemberLevel,
  type MemberStatus,
  formatDate,
  formatTimeRange,
  dayLabel,
  levelLabel,
} from "@/lib/format";
import {
  markActive,
  markInactive,
  markWaitlist,
} from "../actions";

export const metadata = { title: "Member detail" };
export const dynamic = "force-dynamic";

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

type Member = {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  email: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  birthday: string | null;
  level: MemberLevel;
  status: MemberStatus;
  physical_limitations: string | null;
  prior_experience: string | null;
  found_us_via: string | null;
  expectations: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_phone: string | null;
  waiver_signed_at: string | null;
  created_at: string;
};

type Registration = {
  id: string;
  shirt_size: string | null;
  payment_method: string | null;
  payment_status: string;
  payment_received_at: string | null;
  registered_at: string;
  notes: string | null;
  classes: {
    name: string;
    level: string;
    location: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
  } | null;
};

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [memberRes, registrationsRes] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("registrations")
      .select(
        "id,shirt_size,payment_method,payment_status,payment_received_at,registered_at,notes,classes(name,level,location,day_of_week,start_time,end_time)",
      )
      .eq("member_id", id)
      .order("registered_at", { ascending: false }),
  ]);

  const m = memberRes.data as Member | null;
  if (!m) notFound();
  const registrations = (registrationsRes.data ?? []) as unknown as Registration[];

  const fullAddress = [m.street, m.city, m.state, m.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title={`${m.first_name} ${m.last_name}`}
        description={
          m.nickname ? `“${m.nickname}”` : `Member since ${formatDate(m.created_at.slice(0, 10))}`
        }
        action={
          <Link href={`/admin/members/${m.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil size={14} aria-hidden /> Edit
            </Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={LEVEL_TONE[m.level]}>{MEMBER_LEVEL_LABELS[m.level]}</Badge>
        <Badge tone={STATUS_TONE[m.status]}>{memberStatusLabel(m.status)}</Badge>
        {m.waiver_signed_at && (
          <Badge tone="muted">
            Waiver signed {formatDate(m.waiver_signed_at.slice(0, 10))}
          </Badge>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {m.status !== "active" && (
          <form action={markActive}>
            <input type="hidden" name="id" value={m.id} />
            <Button type="submit">Mark active</Button>
          </form>
        )}
        {m.status !== "waitlist" && (
          <form action={markWaitlist}>
            <input type="hidden" name="id" value={m.id} />
            <Button type="submit" variant="outline">
              Move to waitlist
            </Button>
          </form>
        )}
        {m.status !== "inactive" && (
          <form action={markInactive}>
            <input type="hidden" name="id" value={m.id} />
            <Button type="submit" variant="ghost">
              Mark inactive
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg font-medium tracking-tight">
            Contact
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Email">
              <a href={`mailto:${m.email}`} className="hover:text-foreground">
                {m.email}
              </a>
            </Row>
            <Row label="Phone">
              {m.phone ? (
                <a href={`tel:${m.phone}`} className="hover:text-foreground">
                  {m.phone}
                </a>
              ) : (
                "—"
              )}
            </Row>
            <Row label="Address">{fullAddress || "—"}</Row>
            <Row label="Birthday">
              {m.birthday ? formatDate(m.birthday) : "—"}
            </Row>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-medium tracking-tight">
            Emergency contact
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row label="Name">{m.emergency_contact_name ?? "—"}</Row>
            <Row label="Relationship">
              {m.emergency_contact_relationship ?? "—"}
            </Row>
            <Row label="Phone">
              {m.emergency_phone ? (
                <a
                  href={`tel:${m.emergency_phone}`}
                  className="hover:text-foreground"
                >
                  {m.emergency_phone}
                </a>
              ) : (
                "—"
              )}
            </Row>
          </dl>
        </Card>

        {(m.physical_limitations ||
          m.prior_experience ||
          m.found_us_via ||
          m.expectations) && (
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-display text-lg font-medium tracking-tight">
              Notes
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {m.physical_limitations && (
                <Row label="Physical limitations" stack>
                  {m.physical_limitations}
                </Row>
              )}
              {m.prior_experience && (
                <Row label="Prior experience" stack>
                  {m.prior_experience}
                </Row>
              )}
              {m.found_us_via && (
                <Row label="Found us via" stack>
                  {m.found_us_via}
                </Row>
              )}
              {m.expectations && (
                <Row label="Expectations" stack>
                  {m.expectations}
                </Row>
              )}
            </dl>
          </Card>
        )}

        <Card className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-foreground/10 px-5 py-4">
            <h2 className="font-display text-lg font-medium tracking-tight">
              Registrations
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({registrations.length})
              </span>
            </h2>
          </div>
          {registrations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No registrations yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-foreground/5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Class</th>
                    <th className="px-5 py-3 font-medium">When</th>
                    <th className="px-5 py-3 font-medium">Shirt</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-foreground/5 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium">{r.classes?.name ?? "—"}</p>
                        {r.classes?.level && (
                          <p className="mt-1">
                            <Badge tone="cobalt">
                              {levelLabel(r.classes.level)}
                            </Badge>
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {r.classes?.day_of_week
                          ? dayLabel(r.classes.day_of_week)
                          : "—"}
                        <br />
                        <span className="text-foreground">
                          {r.classes?.start_time && r.classes?.end_time
                            ? formatTimeRange(
                                r.classes.start_time,
                                r.classes.end_time,
                              )
                            : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3">{r.shirt_size ?? "—"}</td>
                      <td className="px-5 py-3">
                        <PaymentBadge status={r.payment_status} />
                        {r.payment_method && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            via {r.payment_method}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(r.registered_at.slice(0, 10))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({
  label,
  children,
  stack,
}: {
  label: string;
  children: React.ReactNode;
  stack?: boolean;
}) {
  return (
    <div className={stack ? "" : "grid grid-cols-[8rem_1fr] items-baseline gap-3"}>
      <dt
        className={
          stack
            ? "text-xs uppercase tracking-[0.14em] text-muted-foreground"
            : "text-xs uppercase tracking-[0.14em] text-muted-foreground"
        }
      >
        {label}
      </dt>
      <dd className={stack ? "mt-1 text-foreground/85" : "text-foreground/85"}>
        {children}
      </dd>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "jade"
      : status === "pending"
        ? "vermillion"
        : "muted";
  return <Badge tone={tone as "jade" | "vermillion" | "muted"}>{status}</Badge>;
}
