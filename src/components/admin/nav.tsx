"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Home,
  ListChecks,
  MessageSquareQuote,
  Newspaper,
  PartyPopper,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  /** When true, only render for users with role='admin'. */
  adminOnly?: boolean;
  /** When true, open in a new tab. Used for the public-site link so the
      admin session stays put. */
  newTab?: boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    items: [{ href: "/admin", label: "Overview", icon: Home, exact: true }],
  },
  {
    label: "Daily",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: ScanLine },
      { href: "/admin/rsvps", label: "RSVPs", icon: ListChecks },
      { href: "/admin/registrations", label: "Registrations", icon: CreditCard },
      { href: "/admin/reactivations", label: "Reactivations", icon: UserCheck },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/members", label: "Members", icon: Users },
      { href: "/admin/instructors", label: "Instructors", icon: GraduationCap },
      {
        href: "/admin/users",
        label: "Users",
        icon: ShieldCheck,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Schedule",
    items: [
      { href: "/admin/classes", label: "Classes", icon: ClipboardList },
      { href: "/admin/sessions", label: "Sessions", icon: CalendarRange },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        icon: MessageSquareQuote,
      },
      { href: "/admin/news", label: "News", icon: Newspaper },
      { href: "/admin/wtcd", label: "World Tai Chi Day", icon: PartyPopper },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/admin/settings/rsvps",
        label: "RSVP rules",
        icon: ListChecks,
        adminOnly: true,
      },
      {
        href: "/admin/settings/kiosk",
        label: "Kiosk PIN",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
  {
    items: [
      { href: "/admin/help", label: "Help", icon: HelpCircle },
      {
        href: "/",
        label: "Public site",
        icon: ExternalLink,
        exact: true,
        newTab: true,
      },
    ],
  },
];

export function AdminNav({
  role,
  collapsed = false,
}: {
  role?: "admin" | "instructor" | null;
  /** Desktop only — hides labels and group headings via md: classes,
      so mobile keeps the full vertical list regardless. */
  collapsed?: boolean;
} = {}) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  return (
    <nav aria-label="Admin" className="flex flex-col gap-2">
      {NAV.map((group, gIdx) => {
        const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
        if (visible.length === 0) return null;

        return (
          <div key={group.label ?? `g-${gIdx}`} className="flex flex-col gap-0.5">
            {group.label && (
              <p
                className={cn(
                  "px-2.5 mb-0.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70",
                  collapsed && "md:hidden",
                )}
              >
                {group.label}
              </p>
            )}
            {visible.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  // When collapsed (md+ only) we drop to a centered 36×36
                  // icon button. Mobile always renders the full row.
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noopener noreferrer" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] tracking-wide transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
                    collapsed && "md:justify-center md:gap-0 md:px-0",
                  )}
                >
                  <Icon size={15} aria-hidden />
                  <span className={cn(collapsed && "md:hidden")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
