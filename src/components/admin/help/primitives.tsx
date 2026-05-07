// Shared building blocks for admin help content. Each topic file pulls
// from here so visual style stays consistent across pages and one tweak
// (e.g. step circle size) propagates everywhere.

export function Section({
  title,
  anchor,
  children,
}: {
  title: string;
  anchor: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchor}
      className="mt-12 first:mt-0 scroll-mt-24 border-t border-foreground/10 pt-10 first:border-0 first:pt-0"
    >
      <h2 className="mb-4 font-display text-3xl tracking-tight">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="my-2 space-y-3">{children}</ol>;
}

export function Step({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-base font-medium text-background"
      >
        {n}
      </span>
      <div className="flex-1 pt-1">{children}</div>
    </li>
  );
}

export function Bullets({ children }: { children: React.ReactNode }) {
  return <ul className="my-2 list-disc space-y-2 pl-6">{children}</ul>;
}

export function Pill({
  children,
  primary,
  destructive,
}: {
  children: React.ReactNode;
  primary?: boolean;
  destructive?: boolean;
}) {
  return (
    <span
      className={
        primary
          ? "inline-block rounded-md bg-foreground px-2.5 py-0.5 text-[15px] font-medium text-background"
          : destructive
            ? "inline-block rounded-md border border-vermillion/40 bg-vermillion/10 px-2.5 py-0.5 text-[15px] font-medium text-vermillion"
            : "inline-block rounded-md border border-foreground/20 bg-card px-2.5 py-0.5 text-[15px] font-medium"
      }
    >
      {children}
    </span>
  );
}

export function Example({
  heading = "Example",
  children,
}: {
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-jade/30 bg-jade/5 p-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-jade">
        {heading}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Quote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-4 border-foreground/20 bg-background px-5 py-4 text-[18px] leading-relaxed">
      {children}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border-l-4 border-cobalt/50 bg-cobalt/5 px-5 py-3 text-[17px] text-foreground/85">
      {children}
    </p>
  );
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border-l-4 border-vermillion/50 bg-vermillion/5 px-5 py-3 text-[17px] text-foreground/85">
      <strong className="text-vermillion">Heads up:</strong> {children}
    </p>
  );
}

export function FaqItem({
  q,
  children,
}: {
  q: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-foreground/10 bg-card open:border-foreground/30">
      <summary className="cursor-pointer list-none px-5 py-4 text-[18px] font-medium leading-snug marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="text-foreground/55 group-open:text-foreground">
          {q}
        </span>
      </summary>
      <div className="space-y-3 px-5 pb-5 pt-1">{children}</div>
    </details>
  );
}

export function Intro({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-10 rounded-xl border border-foreground/10 bg-secondary/40 px-6 py-5">
      <div className="m-0">{children}</div>
    </div>
  );
}
