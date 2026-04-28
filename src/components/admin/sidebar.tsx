"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNav } from "./nav";
import { signOut } from "@/app/login/actions";

const STORAGE_KEY = "admin-sidebar-collapsed";

// Sidebar collapse only applies on md+ — mobile already stacks vertically
// with the page content, so the same layout is fine there. Width animates
// via `transition-[width]` on the <aside>.

export function AdminSidebar({
  user,
}: {
  user: { email: string | null; role: "admin" | "instructor" };
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate from localStorage post-mount. One-time sync of a persisted
  // preference — the lint rule doesn't have a cleaner escape hatch for
  // SSR-incompatible reads like this.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of persisted preference
        setCollapsed(true);
      }
    } catch {
      /* private mode etc. — ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      data-collapsed={collapsed || undefined}
      // Pinned to viewport top so the brand strip aligns with the sticky
      // PageHeader on the right column. The layout's outer top padding
      // gives the initial offset; once you scroll past it, both columns
      // stick flush to the top together.
      // `max-h-svh` (not `h-svh`) is the key to sticky working: the aside
      // is content-sized but capped at viewport height. Because the parent
      // flex container has `min-h-svh`, parent ≥ aside, leaving sticky
      // travel room. Using fixed `h-svh` here makes aside == parent on
      // short pages, which kills sticky.
      //
      // Overflow stays on the inner nav region (not the aside) so the
      // brand strip and sign-out remain visible while the nav scrolls.
      className={cn(
        "md:sticky md:top-0 md:self-start md:max-h-svh md:shrink-0 md:flex md:flex-col",
        "transition-[width] duration-200 ease-out",
        collapsed ? "md:w-16" : "md:w-56",
      )}
    >
      {/* Brand + collapse toggle inline. Crane logo on the left, the
          two-line "Woodlands / Tai Chi" lockup beside it (hidden when
          collapsed on desktop), and the toggle on the right. Mobile
          always shows the full lockup. The min-height + border match the
          sticky PageHeader on the right column so both read as one
          continuous top strip. */}
      <div
        className={cn(
          "mb-4 flex h-16 items-center gap-2 border-b border-foreground/10",
          collapsed && "md:h-auto md:flex-col md:items-center md:gap-2 md:border-b-0",
        )}
      >
        <span
          aria-hidden
          className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-foreground/10"
        >
          <Image
            src="/logo.jpg"
            alt=""
            fill
            sizes="36px"
            className="object-cover"
            priority
          />
        </span>

        <p
          aria-label="Woodlands Tai Chi"
          className={cn(
            "flex flex-col font-display text-base font-medium leading-[1.05] tracking-tight",
            // When collapsed on desktop, hide the wordmark — the logo
            // alone reads as the brand.
            collapsed && "md:hidden",
          )}
        >
          <span>Woodlands</span>
          <span className="italic text-vermillion">Tai Chi</span>
        </p>

        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground md:inline-flex",
            !collapsed && "ml-auto",
          )}
        >
          {collapsed ? (
            <ChevronsRight size={16} aria-hidden />
          ) : (
            <ChevronsLeft size={16} aria-hidden />
          )}
        </button>
      </div>

      {/* Email + role chip — hidden on desktop when collapsed. */}
      <div className={cn("mb-3", collapsed && "md:hidden")}>
        <p className="text-[11px] text-muted-foreground truncate">
          {user.email}{" "}
          <span className="ml-1 inline-block rounded-full border border-foreground/15 px-1.5 py-px text-[9px] uppercase tracking-wider">
            {user.role}
          </span>
        </p>
      </div>

      <div className="md:flex-1 md:min-h-0 md:overflow-y-auto md:-mr-2 md:pr-2">
        <AdminNav role={user.role} collapsed={collapsed} />
      </div>

      <form
        action={signOut}
        className="mt-4 md:mt-3 md:pt-3 md:border-t md:border-foreground/8"
      >
        <button
          type="submit"
          aria-label="Sign out"
          title="Sign out"
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-md text-sm font-medium tracking-wide text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors",
            "h-10 px-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <LogOut size={15} aria-hidden />
          <span className={cn(collapsed && "md:hidden")}>Sign out</span>
        </button>
      </form>
    </aside>
  );
}
