export function PageHeader({
  eyebrow,
  title,
  italic,
  intro,
  glyph,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  intro?: string;
  glyph?: string;
}) {
  return (
    <section
      aria-labelledby="page-header-title"
      className="relative overflow-hidden"
    >
      {/* CJK glyph as a background watermark. Anchored to the right
          edge of the section (right-0 md:right-6) and vertically
          centred — at this size the left edge of the character
          extends into the title area, which is the intended overlap.
          Title sits at z-10 above it so it remains readable. */}
      {glyph && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 md:right-6 top-1/2 -translate-y-1/2 hidden md:block font-display leading-none select-none text-foreground/[0.12] text-[clamp(18rem,30vw,33rem)] tracking-tighter"
        >
          {glyph}
        </span>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-7 pb-8 md:px-10 md:pt-10 md:pb-12">
        <p className="rise text-xs uppercase tracking-[0.45em] text-foreground/55 mb-8">
          <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
          {eyebrow}
        </p>
        <h1
          id="page-header-title"
          className="rise font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[1] tracking-[-0.02em]"
          style={{ animationDelay: "120ms" }}
        >
          {title}
          {italic && (
            <span className="block italic text-vermillion">{italic}</span>
          )}
        </h1>
        {intro && (
          <p
            className="rise mt-8 max-w-2xl text-xl text-foreground/75 leading-relaxed"
            style={{ animationDelay: "240ms" }}
          >
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
