"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  Home,
  MessageSquareQuote,
  Newspaper,
  GraduationCap,
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
};

const BASE_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  { href: "/admin/attendance", label: "Attendance", icon: ScanLine },
  { href: "/admin/classes", label: "Classes", icon: ClipboardList },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarRange },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/registrations", label: "Registrations", icon: CreditCard },
  { href: "/admin/instructors", label: "Instructors", icon: GraduationCap },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    icon: MessageSquareQuote,
  },
  { href: "/admin/news", label: "News", icon: Newspaper },
];

const ADMIN_ONLY_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
  { href: "/admin/settings/kiosk", label: "Kiosk PIN", icon: Settings },
];

export function AdminNav({ role }: { role?: "admin" | "instructor" | null } = {}) {
  const pathname = usePathname();
  const items =
    role === "admin" ? [...BASE_ITEMS, ...ADMIN_ONLY_ITEMS] : BASE_ITEMS;

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
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
    </nav>
  );
}
