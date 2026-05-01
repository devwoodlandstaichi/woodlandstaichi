import Link from "next/link";
import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  MessageSquareQuote,
  Newspaper,
  ShoppingBag,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/admin/ui";
import { dayLabel, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AttendanceChart,
  type AttendancePoint,
} from "./attendance-chart";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

type Tone = "vermillion" | "cobalt" | "jade" | "ink" | "amber";

const TONE_STYLES: Record<
  Tone,
  {
    bar: string;
    iconBg: string;
    iconFg: string;
    number: string;
    tint: string;
    glow: string;
  }
> = {
  vermillion: {
    bar: "bg-gradient-to-r from-vermillion via-vermillion-600 to-vermillion-700",
    iconBg: "bg-[color-mix(in_oklch,var(--vermillion-500)_18%,transparent)]",
    iconFg: "text-vermillion",
    number: "text-vermillion-700",
    tint: "bg-[color-mix(in_oklch,var(--vermillion-500)_4%,var(--card))]",
    glow: "ring-2 ring-vermillion/40 shadow-[0_0_30px_-12px_var(--vermillion-500)]",
  },
  cobalt: {
    bar: "bg-gradient-to-r from-cobalt via-cobalt-700 to-cobalt-700",
    iconBg: "bg-[color-mix(in_oklch,var(--cobalt-500)_18%,transparent)]",
    iconFg: "text-cobalt",
    number: "text-cobalt-700",
    tint: "bg-[color-mix(in_oklch,var(--cobalt-500)_5%,var(--card))]",
    glow: "ring-2 ring-cobalt/40",
  },
  jade: {
    bar: "bg-gradient-to-r from-jade via-jade to-cobalt",
    iconBg: "bg-[color-mix(in_oklch,var(--jade-500)_22%,transparent)]",
    iconFg: "text-jade",
    number: "text-jade",
    tint: "bg-[color-mix(in_oklch,var(--jade-500)_6%,var(--card))]",
    glow: "ring-2 ring-jade/40",
  },
  ink: {
    bar: "bg-gradient-to-r from-ink-700 via-ink-800 to-ink-900",
    iconBg: "bg-foreground/10",
    iconFg: "text-foreground",
    number: "text-foreground",
    tint: "",
    glow: "ring-2 ring-foreground/30",
  },
  amber: {
    bar: "bg-gradient-to-r from-vermillion-300 via-vermillion to-vermillion-600",
    iconBg: "bg-[color-mix(in_oklch,var(--vermillion-300)_28%,transparent)]",
    iconFg: "text-vermillion-600",
    number: "text-vermillion-600",
    tint: "bg-[color-mix(in_oklch,var(--vermillion-300)_8%,var(--card))]",
    glow: "ring-2 ring-vermillion/40",
  },
};

type SessionRow = {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  classes: { name: string; level: string } | null;
};

async function loadAttendanceWindow(): Promise<AttendancePoint[]> {
  const supabase = await createClient();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromIso = thirtyDaysAgo.toISOString().slice(0, 10);

  const [sessionsRes, attendanceRes] = await Promise.all([
    supabase
      .from("class_sessions")
      .select(
        "id,session_date,start_time,end_time,classes(name,level)",
      )
      .gte("session_date", fromIso)
      .lte("session_date", todayIso)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("attendance")
      .select("class_session_id")
      .gte("scanned_at", `${fromIso}T00:00:00Z`),
  ]);

  const counts = new Map<string, number>();
  for (const row of attendanceRes.data ?? []) {
    counts.set(
      row.class_session_id,
      (counts.get(row.class_session_id) ?? 0) + 1,
    );
  }

  const rows = (sessionsRes.data ?? []) as unknown as SessionRow[];
  return rows.map((s) => ({
    sessionId: s.id,
    date: s.session_date,
    className: s.classes?.name ?? "Unknown class",
    classLevel: s.classes?.level ?? "",
    startTime: s.start_time,
    endTime: s.end_time,
    count: counts.get(s.id) ?? 0,
  }));
}

async function loadCounts() {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [
    activeClasses,
    activeMembers,
    waitlistMembers,
    upcomingSessions,
    pendingPayments,
    unpaidOrders,
    newsDrafts,
    pendingTestimonials,
    approvedTestimonials,
    pendingReactivations,
  ] = await Promise.all([
    supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "waitlist"),
    supabase
      .from("class_sessions")
      .select("*", { count: "exact", head: true })
      .gte("session_date", todayIso),
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "unpaid"),
    supabase
      .from("news_posts")
      .select("*", { count: "exact", head: true })
      .eq("published", false),
    supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("testimonials")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("member_reactivation_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    classes: activeClasses.count ?? 0,
    members: activeMembers.count ?? 0,
    waitlist: waitlistMembers.count ?? 0,
    sessions: upcomingSessions.count ?? 0,
    pending: pendingPayments.count ?? 0,
    unpaidOrders: unpaidOrders.count ?? 0,
    newsDrafts: newsDrafts.count ?? 0,
    pendingTestimonials: pendingTestimonials.count ?? 0,
    approvedTestimonials: approvedTestimonials.count ?? 0,
    pendingReactivations: pendingReactivations.count ?? 0,
  };
}

type TodaySession = {
  id: string;
  start_time: string;
  end_time: string;
  classes: {
    name: string;
    location: string;
    day_of_week: string;
  } | null;
  attendance_count: number;
};

async function loadTodaySessions(): Promise<TodaySession[]> {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from("class_sessions")
    .select("id,start_time,end_time,classes(name,location,day_of_week)")
    .eq("session_date", todayIso)
    .order("start_time", { ascending: true });

  const ids = (sessions ?? []).map((s) => s.id);
  if (ids.length === 0) return [];

  const { data: scans } = await supabase
    .from("attendance")
    .select("class_session_id")
    .in("class_session_id", ids);

  const counts = new Map<string, number>();
  for (const r of scans ?? []) {
    counts.set(
      r.class_session_id,
      (counts.get(r.class_session_id) ?? 0) + 1,
    );
  }

  return (sessions ?? []).map((s) => {
    const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    return {
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      classes: (cls as TodaySession["classes"]) ?? null,
      attendance_count: counts.get(s.id) ?? 0,
    };
  });
}

export default async function AdminHome() {
  const [counts, attendance, today] = await Promise.all([
    loadCounts(),
    loadAttendanceWindow(),
    loadTodaySessions(),
  ]);

  const tiles: Array<{
    label: string;
    value: number;
    href: string;
    icon: typeof Users;
    sub: string;
    tone: Tone;
    accent?: boolean;
  }> = [
    {
      label: "Pending payments",
      value: counts.pending,
      href: "/admin/registrations?status=pending",
      icon: CreditCard,
      sub: "Mark paid to auto-activate the member.",
      tone: "vermillion",
      accent: counts.pending > 0,
    },
    {
      label: "Unpaid orders",
      value: counts.unpaidOrders,
      href: "/admin/orders?status=unpaid",
      icon: ShoppingBag,
      sub: "Store submissions awaiting payment.",
      tone: "vermillion",
      accent: counts.unpaidOrders > 0,
    },
    {
      label: "Waitlist",
      value: counts.waitlist,
      href: "/admin/members?status=waitlist",
      icon: UserPlus,
      sub: "Members awaiting payment or a seat.",
      tone: "amber",
      accent: counts.waitlist > 0,
    },
    {
      label: "News drafts",
      value: counts.newsDrafts,
      href: "/admin/news?status=drafts",
      icon: Newspaper,
      sub: "Unpublished posts.",
      tone: "amber",
      accent: counts.newsDrafts > 0,
    },
    {
      label: "Testimonials awaiting review",
      value: counts.pendingTestimonials,
      href: "/admin/testimonials?status=pending",
      icon: MessageSquareQuote,
      sub:
        counts.approvedTestimonials > 0
          ? `${counts.approvedTestimonials} published on the site.`
          : "Member submissions land here for approval.",
      tone: "amber",
      accent: counts.pendingTestimonials > 0,
    },
    {
      label: "Reactivation requests",
      value: counts.pendingReactivations,
      href: "/admin/reactivations",
      icon: UserCheck,
      sub: "Returning players asking to come back.",
      tone: "vermillion",
      accent: counts.pendingReactivations > 0,
    },
    {
      label: "Active classes",
      value: counts.classes,
      href: "/admin/classes",
      icon: ClipboardList,
      sub: "On the public schedule.",
      tone: "jade",
    },
    {
      label: "Active members",
      value: counts.members,
      href: "/admin/members",
      icon: Users,
      sub: "Excluding waitlist + inactive.",
      tone: "cobalt",
    },
    {
      label: "Upcoming sessions",
      value: counts.sessions,
      href: "/admin/sessions",
      icon: CalendarRange,
      sub: "Today and after.",
      tone: "ink",
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="A quick read on the school's current state."
      />

      <div className="min-h-0 flex-1 overflow-y-auto pt-4">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const t = TONE_STYLES[tile.tone];
          return (
            <Link key={tile.href} href={tile.href} className="group block">
              <Card
                className={cn(
                  "relative flex h-full flex-col gap-4 overflow-hidden p-5 transition-all duration-200",
                  "group-hover:-translate-y-0.5 group-hover:shadow-md",
                  t.tint,
                  tile.accent && t.glow,
                )}
              >
                {/* Top accent bar */}
                <span
                  aria-hidden
                  className={cn("absolute inset-x-0 top-0 h-1", t.bar)}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {tile.label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                      t.iconBg,
                      t.iconFg,
                    )}
                  >
                    <Icon size={18} aria-hidden />
                  </span>
                </div>

                <p
                  className={cn(
                    "font-display text-5xl font-medium leading-none",
                    t.number,
                  )}
                >
                  {tile.value}
                </p>

                <p className="text-xs text-muted-foreground">{tile.sub}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <TodayPanel sessions={today} />

      <AttendanceChart data={attendance} />
      </div>
    </>
  );
}

function TodayPanel({ sessions }: { sessions: TodaySession[] }) {
  if (sessions.length === 0) {
    return (
      <Card className="mb-6 p-6">
        <h2 className="font-medium text-base">Today</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No sessions scheduled today.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-6 p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-medium text-base">Today</h2>
        <Link
          href="/admin/attendance"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Open attendance scanner →
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-foreground/8">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-baseline justify-between gap-3 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{s.classes?.name ?? "Class"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {s.classes?.day_of_week
                  ? dayLabel(s.classes.day_of_week)
                  : ""}{" "}
                · {formatTimeRange(s.start_time, s.end_time)}
                {s.classes?.location ? ` · ${s.classes.location}` : ""}
              </p>
            </div>
            <span className="font-mono tabular-nums text-muted-foreground">
              {s.attendance_count}{" "}
              {s.attendance_count === 1 ? "scan" : "scans"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
