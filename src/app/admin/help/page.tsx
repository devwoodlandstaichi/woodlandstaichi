import Link from "next/link";
import {
  CalendarRange,
  ClipboardList,
  CreditCard,
  GraduationCap,
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
import { PageHeader } from "@/components/admin/ui";
import {
  HELP_REGISTRY,
  type HelpTopic,
} from "@/components/admin/help/registry";
import { getSessionUser } from "@/lib/auth/dal";

export const metadata = { title: "Help" };

// Help index. Mirrors the admin sidebar groupings so finding a topic
// here feels like finding the page in the nav.

type Group = {
  label: string;
  topics: { id: HelpTopic; icon: typeof Home }[];
};

const GROUPS: Group[] = [
  {
    label: "Daily",
    topics: [
      { id: "overview", icon: Home },
      { id: "attendance", icon: ScanLine },
      { id: "rsvps", icon: ListChecks },
      { id: "registrations", icon: CreditCard },
      { id: "reactivations", icon: UserCheck },
      { id: "orders", icon: ShoppingBag },
    ],
  },
  {
    label: "People",
    topics: [
      { id: "members", icon: Users },
      { id: "instructors", icon: GraduationCap },
      { id: "users", icon: ShieldCheck },
    ],
  },
  {
    label: "Schedule",
    topics: [
      { id: "classes", icon: ClipboardList },
      { id: "sessions", icon: CalendarRange },
    ],
  },
  {
    label: "Content",
    topics: [
      { id: "testimonials", icon: MessageSquareQuote },
      { id: "news", icon: Newspaper },
      { id: "wtcd", icon: PartyPopper },
      { id: "store", icon: ShoppingBag },
    ],
  },
  {
    label: "Settings",
    topics: [
      { id: "settings-rsvps", icon: ListChecks },
      { id: "settings-kiosk", icon: Settings },
    ],
  },
];

export default async function HelpIndexPage() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  return (
    <>
      <PageHeader
        title="Help"
        description="Step-by-step guides for the parts of the admin pages."
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-2 py-8">
          <p className="mb-8 text-[19px] leading-relaxed text-foreground/80">
            Pick a topic to read how to use that part of the admin. Each
            page has plain-English steps and an example. You can also
            open these from any admin page via the &ldquo;Help&rdquo;
            button next to the page title.
          </p>

          <div className="space-y-8">
            {GROUPS.map((g) => {
              const visible = g.topics.filter((t) => {
                const entry = HELP_REGISTRY[t.id];
                return !entry.adminOnly || isAdmin;
              });
              if (visible.length === 0) return null;

              return (
                <div key={g.label}>
                  <p className="mb-3 text-[10px] uppercase tracking-[0.32em] text-foreground/55">
                    {g.label}
                  </p>
                  <div className="grid gap-3">
                    {visible.map((t) => {
                      const entry = HELP_REGISTRY[t.id];
                      const Icon = t.icon;
                      return (
                        <Link
                          key={t.id}
                          href={entry.fullPageHref}
                          className="flex items-start gap-4 rounded-xl border border-foreground/10 bg-card p-5 transition-colors hover:border-foreground/30"
                        >
                          <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                            <Icon size={18} aria-hidden />
                          </span>
                          <div className="flex-1">
                            <p className="text-[20px] font-medium leading-snug">
                              {entry.title}
                            </p>
                            <p className="mt-1 text-base text-foreground/70">
                              {entry.description}
                            </p>
                          </div>
                          <span
                            aria-hidden
                            className="text-2xl text-foreground/40"
                          >
                            →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-base text-foreground/55">
            Need help with something not listed here? Email{" "}
            <a
              href="mailto:info@woodlandstaichi.com"
              className="underline hover:text-foreground"
            >
              info@woodlandstaichi.com
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
