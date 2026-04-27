import Image from "next/image";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Decorative vertical mark — sits behind the type */}
      <span
        aria-hidden
        className="vertical-mark absolute right-6 top-24 hidden lg:block text-[11rem] leading-none select-none"
      >
        靜
      </span>

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-6 px-6 py-12 md:px-10 md:py-20">
        {/* Headline column */}
        <div className="col-span-12 lg:col-span-8 relative">
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

        {/* Crest column */}
        <div className="col-span-12 lg:col-span-4 relative flex items-start justify-center lg:justify-end">
          <div className="fade relative" style={{ animationDelay: "200ms" }}>
            <span
              aria-hidden
              className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-br from-vermillion/15 via-transparent to-cobalt/10 blur-3xl"
            />
            <div className="relative h-44 w-44 md:h-56 md:w-56 lg:h-64 lg:w-64">
              <Image
                src="/logo.jpg"
                alt="Woodlands Tai Chi crane crest"
                fill
                sizes="(max-width: 1024px) 18rem, 20rem"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-foreground/50">
              Est. community — taught since 2018
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
