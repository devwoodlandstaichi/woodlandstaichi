import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Cake,
  Mail,
  MapPin,
  Pencil,
  Phone,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card } from "@/components/admin/ui";
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
  bio: string | null;
  photo_url: string | null;
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

  const fullName = `${m.first_name} ${m.last_name}`.trim();
  const initials = `${m.first_name[0] ?? ""}${m.last_name[0] ?? ""}`.toUpperCase();
  const cityState = [m.city, m.state].filter(Boolean).join(", ");
  const fullAddress = [m.street, m.city, m.state, m.postal_code]
    .filter(Boolean)
    .join(", ");

  const notesItems = [
    m.physical_limitations && {
      label: "Physical limitations",
      value: m.physical_limitations,
    },
    m.prior_experience && {
      label: "Prior experience",
      value: m.prior_experience,
    },
    m.found_us_via && { label: "Found us via", value: m.found_us_via },
    m.expectations && { label: "Expectations", value: m.expectations },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-12">
      {/* HERO */}
      <section
        aria-label="Member overview"
        className="relative isolate overflow-hidden rounded-2xl border border-foreground/10"
      >
        {/* atmospheric backdrop */}
        <div className="relative h-44 w-full bg-foreground md:h-52">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              background:
                "radial-gradient(80% 120% at 85% 0%, color-mix(in oklch, var(--vermillion-500) 55%, transparent) 0%, transparent 60%), radial-gradient(60% 110% at 0% 100%, color-mix(in oklch, var(--cobalt-500) 50%, transparent) 0%, transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          {/* CJK accent — quiet, decorative */}
          <span
            aria-hidden
            className="absolute right-6 top-4 select-none font-display text-7xl leading-none text-background/15 md:text-8xl"
          >
            和
          </span>

          {/* Status / level chips top-right */}
          <div className="absolute right-4 top-4 z-10 hidden flex-wrap items-center gap-2 md:flex">
            <Badge tone={STATUS_TONE[m.status]}>
              {memberStatusLabel(m.status)}
            </Badge>
            <Badge tone={LEVEL_TONE[m.level]}>
              {MEMBER_LEVEL_LABELS[m.level]}
            </Badge>
            {m.waiver_signed_at && (
              <Badge tone="muted">Waiver signed</Badge>
            )}
          </div>

          {/* Action pills bottom-right */}
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <Link href={`/admin/members/${m.id}/qr`}>
              <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm">
                <QrCode size={14} aria-hidden /> QR
              </Button>
            </Link>
            <Link href={`/admin/members/${m.id}/edit`}>
              <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm">
                <Pencil size={14} aria-hidden /> Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* identity strip — avatar overlaps banner edge */}
        <div className="relative bg-card px-5 pb-5 pt-14 md:px-7 md:pt-16">
          <div className="absolute -top-12 left-5 md:left-7">
            {m.photo_url ? (
              <Image
                src={m.photo_url}
                alt={fullName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-md"
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-vermillion/15 shadow-md"
                aria-label={fullName}
              >
                <span className="font-display text-3xl font-medium tracking-tight text-vermillion">
                  {initials || "·"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                {fullName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {m.nickname ? (
                  <span className="italic">&ldquo;{m.nickname}&rdquo;</span>
                ) : null}
                {m.nickname ? <span className="mx-2">·</span> : null}
                Member since {formatDate(m.created_at.slice(0, 10))}
                {cityState ? (
                  <>
                    <span className="mx-2">·</span>
                    {cityState}
                  </>
                ) : null}
              </p>

              {/* mobile-only chip cluster (the desktop one sits in the banner) */}
              <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
                <Badge tone={STATUS_TONE[m.status]}>
                  {memberStatusLabel(m.status)}
                </Badge>
                <Badge tone={LEVEL_TONE[m.level]}>
                  {MEMBER_LEVEL_LABELS[m.level]}
                </Badge>
                {m.waiver_signed_at && (
                  <Badge tone="muted">Waiver signed</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {m.status !== "active" && (
                <form action={markActive}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" size="sm">
                    Mark active
                  </Button>
                </form>
              )}
              {m.status !== "waitlist" && (
                <form action={markWaitlist}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Move to waitlist
                  </Button>
                </form>
              )}
              {m.status !== "inactive" && (
                <form action={markInactive}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Mark inactive
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ANCHOR NAV */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-20 -mx-1 mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-foreground/10 bg-background/85 px-1 py-3 text-xs uppercase tracking-[0.18em] text-foreground/55 backdrop-blur"
      >
        <span aria-hidden className="inline-block h-px w-6 bg-vermillion" />
        <a href="#contact" className="hover:text-foreground">
          Contact
        </a>
        <a href="#emergency" className="hover:text-foreground">
          Emergency
        </a>
        {m.bio && (
          <a href="#bio" className="hover:text-foreground">
            Biography
          </a>
        )}
        {notesItems.length > 0 && (
          <a href="#notes" className="hover:text-foreground">
            Notes
          </a>
        )}
        <a href="#registrations" className="hover:text-foreground">
          Registrations
          <span className="ml-1 text-foreground/45">
            ({registrations.length})
          </span>
        </a>
      </nav>

      {/* QUICK INFO — 4-up icon grid */}
      <section id="contact" className="mt-8 scroll-mt-20">
        <Card className="grid gap-px overflow-hidden bg-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile
            icon={Mail}
            label="Email"
            value={
              <a
                href={`mailto:${m.email}`}
                className="break-words hover:text-vermillion"
              >
                {m.email}
              </a>
            }
          />
          <InfoTile
            icon={Phone}
            label="Phone"
            value={
              m.phone ? (
                <a href={`tel:${m.phone}`} className="hover:text-vermillion">
                  {m.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoTile
            icon={Cake}
            label="Birthday"
            value={m.birthday ? formatDate(m.birthday) : "—"}
          />
          <InfoTile
            icon={MapPin}
            label="Address"
            value={fullAddress || "—"}
          />
        </Card>
      </section>

      {/* EMERGENCY CONTACT */}
      <section id="emergency" className="mt-8 scroll-mt-20">
        <SectionHeading
          eyebrow="Emergency"
          title="In case of."
          accent="emergency"
        />
        <Card className="mt-4 grid gap-6 p-5 sm:grid-cols-3">
          <Stack label="Name">{m.emergency_contact_name ?? "—"}</Stack>
          <Stack label="Relationship">
            {m.emergency_contact_relationship ?? "—"}
          </Stack>
          <Stack label="Phone">
            {m.emergency_phone ? (
              <a
                href={`tel:${m.emergency_phone}`}
                className="hover:text-vermillion"
              >
                {m.emergency_phone}
              </a>
            ) : (
              "—"
            )}
          </Stack>
        </Card>
      </section>

      {/* BIO */}
      {m.bio && (
        <section id="bio" className="mt-8 scroll-mt-20">
          <SectionHeading eyebrow="Biography" title="In their words." />
          <Card className="mt-4 p-6">
            <p className="text-[0.95rem] leading-[1.65] text-foreground/85 whitespace-pre-wrap">
              {m.bio}
            </p>
          </Card>
        </section>
      )}

      {/* NOTES */}
      {notesItems.length > 0 && (
        <section id="notes" className="mt-8 scroll-mt-20">
          <SectionHeading
            eyebrow="On record"
            title="From their registration."
          />
          <Card className="mt-4 grid gap-5 p-5 sm:grid-cols-2">
            {notesItems.map((n) => (
              <Stack key={n.label} label={n.label}>
                {n.value}
              </Stack>
            ))}
          </Card>
        </section>
      )}

      {/* REGISTRATIONS */}
      <section id="registrations" className="mt-8 scroll-mt-20">
        <SectionHeading
          eyebrow={`Registrations · ${registrations.length}`}
          title="Classes they're enrolled in."
        />
        {registrations.length === 0 ? (
          <Card className="mt-4 p-8 text-center text-sm text-muted-foreground">
            No registrations yet.
          </Card>
        ) : (
          <div className="mt-4 grid gap-3">
            {registrations.map((r) => {
              const c = r.classes;
              return (
                <Card
                  key={r.id}
                  className="grid grid-cols-1 items-center gap-4 p-4 md:grid-cols-[1fr_auto] md:gap-6 md:p-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-lg font-medium tracking-tight">
                        {c?.name ?? "—"}
                      </h3>
                      {c?.level && (
                        <Badge tone="cobalt">{levelLabel(c.level)}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c?.day_of_week ? dayLabel(c.day_of_week) : "—"}
                      {c?.start_time && c?.end_time ? (
                        <>
                          <span className="mx-2">·</span>
                          <span className="font-mono tabular-nums text-foreground/85">
                            {formatTimeRange(c.start_time, c.end_time)}
                          </span>
                        </>
                      ) : null}
                      {c?.location ? (
                        <>
                          <span className="mx-2">·</span>
                          {c.location}
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-end md:gap-2">
                    <PaymentBadge status={r.payment_status} />
                    <p className="text-xs text-muted-foreground">
                      Registered {formatDate(r.registered_at.slice(0, 10))}
                      {r.payment_method && (
                        <>
                          <span className="mx-1.5">·</span>
                          via {r.payment_method}
                        </>
                      )}
                      {r.shirt_size && (
                        <>
                          <span className="mx-1.5">·</span>
                          shirt {r.shirt_size}
                        </>
                      )}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 bg-card p-5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vermillion/10 text-vermillion">
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm text-foreground/90">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  accent,
}: {
  eyebrow: string;
  title: string;
  accent?: "emergency";
}) {
  return (
    <div>
      <p className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.32em] text-muted-foreground">
        <span
          aria-hidden
          className={
            accent === "emergency"
              ? "inline-block h-px w-6 bg-vermillion"
              : "inline-block h-px w-6 bg-foreground/40"
          }
        />
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-xl font-medium tracking-tight md:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function Stack({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground/85">{children}</dd>
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
