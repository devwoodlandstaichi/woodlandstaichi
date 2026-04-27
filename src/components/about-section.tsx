const PILLARS = [
  {
    glyph: "心",
    label: "Mind",
    body: "Empty the mind. Let no distracting thought occupy you. Concentration becomes its own quiet companion.",
  },
  {
    glyph: "形",
    label: "Body",
    body: "Soften every muscle. Imagine yourself weightless — a feather floating in air. Form follows release.",
  },
  {
    glyph: "氣",
    label: "Breath",
    body: "Breath threads the form. Slow, deliberate, alive. The body remembers what the mind forgets.",
  },
];

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-12">
        <div className="col-span-12 md:col-span-5">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            The practice
          </p>
          <h2
            id="about-title"
            className="font-display text-5xl md:text-6xl leading-[1] tracking-tight"
          >
            Three threads,
            <span className="block italic text-vermillion">one motion.</span>
          </h2>
          <div className="rule mt-10" />
          <p className="mt-8 text-lg text-foreground/80 leading-relaxed">
            Tai Chi began as a martial art and has become, for most who
            practice it, something quieter — a way of moving that softens the
            body, steadies the mind, and turns daily life a little more
            graceful.
          </p>
          <p className="mt-4 text-lg text-foreground/80 leading-relaxed">
            No prior fitness required. No prerequisites. Show up and breathe.
          </p>
        </div>

        <div className="col-span-12 md:col-span-7 md:pl-8">
          <ul className="space-y-10">
            {PILLARS.map((p, i) => (
              <li
                key={p.label}
                className="grid grid-cols-[auto_1fr] gap-6 items-start"
              >
                <div className="flex flex-col items-center gap-2">
                  <span
                    aria-hidden
                    className="font-display text-6xl leading-none text-foreground/85 select-none"
                    style={{
                      textShadow:
                        i === 0
                          ? "0 0 60px color-mix(in oklch, var(--vermillion-500) 50%, transparent)"
                          : undefined,
                    }}
                  >
                    {p.glyph}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/55">
                    {p.label}
                  </span>
                </div>
                <p className="text-lg text-foreground/80 leading-relaxed pt-3">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
