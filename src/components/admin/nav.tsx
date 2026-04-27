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
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: Home, exact: true },
  { href: "/admin/classes", label: "Classes", icon: ClipboardList },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarRange },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/registrations", label: "Registrations", icon: CreditCard },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    icon: MessageSquareQuote,
  },
  { href: "/admin/news", label: "News", icon: Newspaper },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
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
