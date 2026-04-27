import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "News & announcements",
  description:
    "Announcements, schedule changes, and news from Woodlands Tai Chi.",
};

type Post = {
  id: string;
  title: string;
  body: string;
  posted_at: string;
};

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Tiny markdown subset: **bold**, [link](url). Anything fancier should be
// rendered with a real parser when we eventually add one.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const boldRegex = /\*\*([^*]+)\*\*/;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(linkRegex);
    const boldMatch = remaining.match(boldRegex);
    const linkIdx = linkMatch?.index ?? Infinity;
    const boldIdx = boldMatch?.index ?? Infinity;

    if (linkIdx === Infinity && boldIdx === Infinity) {
      out.push(remaining);
      break;
    }

    if (linkIdx < boldIdx && linkMatch) {
      if (linkIdx > 0) out.push(remaining.slice(0, linkIdx));
      out.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-vermillion underline-offset-4 hover:underline"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkIdx + linkMatch[0].length);
    } else if (boldMatch) {
      if (boldIdx > 0) out.push(remaining.slice(0, boldIdx));
      out.push(
        <strong key={key++} className="font-semibold">
          {boldMatch[1]}
        </strong>,
      );
      remaining = remaining.slice(boldIdx + boldMatch[0].length);
    }
  }
  return out;
}

export default async function NewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("id,title,body,posted_at")
    .eq("published", true)
    .order("posted_at", { ascending: false });
  const posts: Post[] = data ?? [];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="News"
          title="Latest"
          italic="from the school."
          intro="Announcements, schedule changes, and small things worth knowing."
          glyph="報"
        />

        <section className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          {posts.length === 0 ? (
            <p className="text-foreground/60 italic">
              No posts yet. Check back soon.
            </p>
          ) : (
            <ul className="space-y-8">
              {posts.map((post, i) => (
                <li
                  key={post.id}
                  className={`${i > 0 ? "border-t border-foreground/10 pt-8" : ""}`}
                >
                  <article>
                    <p className="text-xs uppercase tracking-[0.3em] text-foreground/55">
                      {formatDate(post.posted_at)}
                    </p>
                    <h2 className="mt-3 font-display text-3xl md:text-4xl leading-[1.1] tracking-tight">
                      {post.title}
                    </h2>
                    <div className="mt-5 text-lg text-foreground/85 leading-relaxed">
                      {post.body
                        .split(/\n\n+/)
                        .map((para, idx) => (
                          <p key={idx} className={idx > 0 ? "mt-4" : ""}>
                            {renderInline(para)}
                          </p>
                        ))}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
