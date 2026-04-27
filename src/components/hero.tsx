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

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-10 px-6 py-20 md:px-10 md:py-32">
        {/* Headline column */}
        <div className="col-span-12 lg:col-span-8 relative">
          <p className="rise text-xs uppercase tracking-[0.45em] text-foreground/55 mb-8">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            The Woodlands · Texas
          </p>

          <h1
            id="hero-title"
            className="rise font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.95] tracking-[-0.02em] text-foreground"
            style={{ animationDelay: "120ms" }}
          >
            Meditation
            <span className="block italic text-vermillion">in motion.</span>
          </h1>

          <p
            className="rise mt-10 max-w-xl text-xl md:text-2xl leading-relaxed text-foreground/75"
            style={{ animationDelay: "240ms" }}
          >
            A community school teaching Tai Chi in the lineage of{" "}
            <span className="font-display italic">Master George Ling Hu</span>.
            Empty the mind. Soften the body. Move like a feather floating in
            air.
          </p>

          <div
            className="rise mt-12 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "360ms" }}
          >
            <a
              href="#classes"
              className="group inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background transition-transform hover:-translate-y-0.5"
            >
              See the schedule
              <span
                aria-hidden
                className="inline-block transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </a>
            <a
              href="/about"
              className="inline-flex items-center gap-3 rounded-full border border-foreground/20 px-7 py-4 text-base font-medium hover:bg-foreground/5 transition-colors"
            >
              Why Tai Chi?
            </a>
          </div>

          <p className="rise mt-10 text-sm text-foreground/60" style={{ animationDelay: "480ms" }}>
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
            <div className="relative h-56 w-56 md:h-72 md:w-72 lg:h-80 lg:w-80">
              <Image
                src="/logo.png"
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
