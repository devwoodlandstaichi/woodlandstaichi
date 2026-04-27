import Image from "next/image";

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
      {glyph && (
        <span
          aria-hidden
          className="vertical-mark absolute right-6 top-16 hidden lg:block text-[10rem] leading-none select-none"
        >
          {glyph}
        </span>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-6 px-6 pt-12 pb-8 md:px-10 md:pt-20 md:pb-12">
        <div className="col-span-12 lg:col-span-9">
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
        <div className="col-span-12 lg:col-span-3 flex items-end justify-start lg:justify-end">
          <Image
            src="/logo.jpg"
            alt=""
            width={120}
            height={120}
            className="opacity-90"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
