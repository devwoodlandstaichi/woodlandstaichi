import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { RESOURCE_LINKS } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Links & resources — articles about Tai Chi",
  description:
    "Articles, videos, and external resources about Tai Chi compiled by Woodlands Tai Chi.",
};

export default function LinksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Links"
          title="Reading"
          italic="& resources."
          intro="Articles, research, and videos about Tai Chi — gathered for anyone curious about the practice beyond what we cover in class."
          glyph="鏈"
        />

        <section className="mx-auto max-w-4xl px-6 py-10 md:py-14 space-y-10">
          {RESOURCE_LINKS.map((group) => (
            <div key={group.category}>
              <h2 className="font-display text-3xl md:text-4xl tracking-tight border-b border-foreground/10 pb-4">
                {group.category}
              </h2>
              <ul className="mt-6 divide-y divide-foreground/8">
                {group.items.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-baseline justify-between gap-4 py-4 hover:bg-foreground/[0.02] transition-colors -mx-3 px-3 rounded"
                    >
                      <span className="text-lg text-foreground/85 group-hover:text-foreground">
                        {item.title}
                      </span>
                      <span
                        aria-hidden
                        className="shrink-0 text-vermillion-600 transition-transform group-hover:translate-x-1"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
