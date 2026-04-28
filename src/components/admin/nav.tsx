"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Home,
  MessageSquareQuote,
  Newspaper,
  ScanLine,
  Settings,
  ShieldCheck,
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
      { href: "/admin/registrations", label: "Registrations", icon: CreditCard },
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
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/admin/settings/kiosk",
        label: "Kiosk PIN",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
];

export function AdminNav({ role }: { role?: "admin" | "instructor" | null } = {}) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {NAV.map((group, gIdx) => {
        const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
        if (visible.length === 0) return null;

        return (
          <div key={group.label ?? `g-${gIdx}`} className="flex flex-col gap-1">
            {group.label && (
              <p className="px-3 mb-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
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
                  className={cn(
                    "flex h-12 items-center gap-3 rounded-md px-3 text-sm tracking-wide transition-colors",
                    "min-h-12", // 48px tap target
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
