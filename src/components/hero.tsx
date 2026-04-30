export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* The watermark lives inside the max-w-7xl container so it
          tracks the right edge of the content, not the viewport. With
          `overflow-hidden` on the section, anything that bleeds past
          the section edges still gets clipped. */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-6 px-6 pt-7 pb-12 md:px-10 md:pt-10 md:pb-20">
        {/* CJK background watermark — same treatment as PageHeader.
            Stillness (靜) for the home hero. Right edge anchored to the
            inner-content right edge so resizing keeps it in line with
            the headline column. */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 hidden md:block font-display leading-none select-none text-foreground/[0.12] text-[clamp(18rem,30vw,33rem)] tracking-tighter md:right-10"
        >
          靜
        </span>

        {/* Headline column — full width now that the crest column is gone */}
        <div className="col-span-12 relative">
          <p className="rise text-xs uppercase tracking-[0.45em] text-foreground/55 mb-8">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            The Woodlands · Texas
          </p>

          <h1
            id="hero-title"
            className="rise font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-foreground"
            style={{ animationDelay: "120ms" }}
          >
            Meditation
            <span className="block italic text-vermillion">in motion.</span>
          </h1>

          <p
            className="rise mt-6 max-w-xl text-xl md:text-2xl leading-relaxed text-foreground/75"
            style={{ animationDelay: "240ms" }}
          >
            A community school teaching Tai Chi in the lineage of{" "}
            <span className="font-display italic">Master George Ling Hu</span>.
            Empty the mind. Soften the body. Move like a feather floating in
            air.
          </p>

          <div
            className="rise mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "360ms" }}
          >
            <a
              href="/classes/register"
              className="group inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background transition-transform hover:-translate-y-0.5 hover:bg-vermillion-600"
            >
              Register for a beginner cohort
              <span
                aria-hidden
                className="inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </a>
            <a
              href="/classes"
              className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
            >
              See the schedule
            </a>
          </div>

          <p className="rise mt-6 text-sm text-foreground/60" style={{ animationDelay: "480ms" }}>
            <span className="text-vermillion font-medium">Free</span> for beginners ·{" "}
            Now enrolling for <span className="font-medium text-foreground">June &amp; October 2026</span>
          </p>
        </div>

      </div>
    </section>
  );
}
