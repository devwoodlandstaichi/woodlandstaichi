"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = { href: string; label: string };

export function MemberTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="My profile sections"
      className="mx-auto max-w-7xl border-b border-foreground/10 px-6 md:px-10"
    >
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "relative inline-flex items-center py-4 text-xs uppercase tracking-[0.32em] transition-colors",
                  active
                    ? "text-foreground"
                    : "text-foreground/55 hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mr-3 inline-block h-px transition-all",
                    active
                      ? "w-6 bg-vermillion"
                      : "w-3 bg-foreground/30",
                  )}
                />
                {t.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-px h-px bg-vermillion"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
