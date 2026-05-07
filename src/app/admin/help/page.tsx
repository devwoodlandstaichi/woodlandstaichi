import Link from "next/link";
import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Help" };

// Help index. As more topic pages are written they get added here.
// Pages are designed to be readable to a non-technical user (older
// audience) — large text, plain language, numbered steps.

const TOPICS = [
  {
    href: "/admin/help/news",
    icon: Newspaper,
    title: "News",
    description:
      "Write, edit, hide, and delete stories for the school website.",
    ready: true,
  },
] as const;

export default function HelpIndexPage() {
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
            page has plain-English steps and an example.
          </p>

          <div className="grid gap-3">
            {TOPICS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-start gap-4 rounded-xl border border-foreground/10 bg-card p-5 transition-colors hover:border-foreground/30"
              >
                <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
                  <t.icon size={18} aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-[20px] font-medium leading-snug">
                    {t.title}
                  </p>
                  <p className="mt-1 text-base text-foreground/70">
                    {t.description}
                  </p>
                </div>
                <span aria-hidden className="text-2xl text-foreground/40">
                  →
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-12 text-base text-foreground/55">
            More topics will appear here as they&rsquo;re written. If you
            need help with something not listed yet, email{" "}
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
