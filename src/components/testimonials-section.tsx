import { createClient } from "@/lib/supabase/server";
import { Quote } from "lucide-react";

type Testimonial = {
  id: string;
  member_name: string;
  attribution: string | null;
  quote: string;
};

export async function TestimonialsSection({ limit }: { limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("testimonials")
    .select("id,member_name,attribution,quote")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  const items: Testimonial[] = data ?? [];

  if (items.length === 0) return null;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-12 mb-16">
        <div className="col-span-12 md:col-span-5">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            From the circle
          </p>
          <h2
            id="testimonials-title"
            className="font-display text-5xl md:text-6xl leading-[1] tracking-tight"
          >
            What members
            <span className="block italic text-vermillion">say.</span>
          </h2>
        </div>
        <div className="col-span-12 md:col-span-7 md:pt-4">
          <p className="text-lg text-foreground/75 leading-relaxed">
            Voices from current and past players — many of whom started with no
            prior fitness, no martial-arts background, and no expectation that
            they&apos;d still be here years later.
          </p>
        </div>
      </div>

      <ul
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        style={{ columnGap: "1.5rem" }}
      >
        {items.map((t, i) => (
          <li
            key={t.id}
            className="group relative break-inside-avoid rounded-xl border border-foreground/10 bg-card p-7 transition-colors hover:border-vermillion/30"
          >
            <Quote
              size={20}
              className="text-vermillion/40 mb-4"
              aria-hidden
              strokeWidth={1.5}
            />
            <blockquote className="text-foreground/85 leading-relaxed">
              {t.quote}
            </blockquote>
            <footer className="mt-6 pt-5 border-t border-foreground/8 flex items-baseline justify-between gap-3">
              <cite className="not-italic font-display text-lg tracking-tight">
                {t.member_name}
              </cite>
              {t.attribution && (
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/50 text-right">
                  {t.attribution}
                </span>
              )}
            </footer>
            {/* corner index marker */}
            <span
              aria-hidden
              className="absolute right-5 top-5 text-[10px] tabular-nums text-foreground/30 font-mono"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
