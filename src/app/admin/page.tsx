import Link from "next/link";
import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

async function loadCounts() {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [
    activeClasses,
    activeMembers,
    waitlistMembers,
    upcomingSessions,
    pendingPayments,
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
  ]);

  return {
    classes: activeClasses.count ?? 0,
    members: activeMembers.count ?? 0,
    waitlist: waitlistMembers.count ?? 0,
    sessions: upcomingSessions.count ?? 0,
    pending: pendingPayments.count ?? 0,
  };
}

export default async function AdminHome() {
  const counts = await loadCounts();

  const tiles: Array<{
    label: string;
    value: number;
    href: string;
    icon: typeof Users;
    sub: string;
    accent?: boolean;
  }> = [
    {
      label: "Pending payments",
      value: counts.pending,
      href: "/admin/registrations?status=pending",
      icon: CreditCard,
      sub: "Mark paid to auto-activate the member.",
      accent: counts.pending > 0,
    },
    {
      label: "Waitlist",
      value: counts.waitlist,
      href: "/admin/members?status=waitlist",
      icon: UserPlus,
      sub: "Members awaiting payment or a seat.",
      accent: counts.waitlist > 0,
    },
    {
      label: "Active classes",
      value: counts.classes,
      href: "/admin/classes",
      icon: ClipboardList,
      sub: "On the public schedule.",
    },
    {
      label: "Active members",
      value: counts.members,
      href: "/admin/members",
      icon: Users,
      sub: "Excluding waitlist + inactive.",
    },
    {
      label: "Upcoming sessions",
      value: counts.sessions,
      href: "/admin/sessions",
      icon: CalendarRange,
      sub: "Today and after.",
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="A quick read on the school's current state."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.href} href={tile.href} className="group block">
              <Card
                className={`flex h-full flex-col gap-4 p-5 transition-colors group-hover:border-foreground/30 ${
                  tile.accent
                    ? "border-vermillion/30 bg-[color-mix(in_oklch,var(--vermillion-500)_5%,transparent)]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-[0.16em]">
                    {tile.label}
                  </span>
                  <Icon size={18} aria-hidden />
                </div>
                <p className="font-display text-5xl font-medium leading-none">
                  {tile.value}
                </p>
                <p className="text-xs text-muted-foreground">{tile.sub}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
