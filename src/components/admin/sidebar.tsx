"use client";

import { useEffect, useState } from "react";
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
      className={cn(
        "md:sticky md:top-6 md:h-[calc(100svh-3rem)] md:shrink-0 md:flex md:flex-col",
        "transition-[width] duration-200 ease-out",
        collapsed ? "md:w-16" : "md:w-56",
      )}
    >
      {/* Brand + collapse toggle inline. When collapsed (md+ only), the
          brand collapses to a square "W" pip and the toggle stacks
          underneath it. Mobile always shows the full brand. */}
      <div
        className={cn(
          "mb-4 flex items-center gap-2",
          collapsed && "md:flex-col md:items-center md:gap-2",
        )}
      >
        <p
          aria-label="Woodlands Tai Chi"
          className={cn(
            "flex flex-col font-display text-base font-medium leading-[1.05] tracking-tight",
            // When collapsed on desktop, swap the two-line brand for a
            // single square pip (kept consistent with the public site's
            // header lockup styling).
            collapsed &&
              "md:hidden",
          )}
        >
          <span>Woodlands</span>
          <span className="italic text-vermillion">Tai Chi</span>
        </p>

        {/* Collapsed-state brand pip — only visible on md+ when collapsed. */}
        <span
          aria-hidden
          className={cn(
            "hidden",
            collapsed &&
              "md:inline-flex md:h-9 md:w-9 md:items-center md:justify-center md:rounded-md md:bg-foreground md:text-background md:font-display md:text-sm",
          )}
        >
          W
        </span>

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
      <div className={cn("mb-4", collapsed && "md:hidden")}>
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
