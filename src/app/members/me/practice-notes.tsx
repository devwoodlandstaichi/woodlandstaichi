type PracticeNotesProps = {
  physical_limitations: string | null;
  prior_experience: string | null;
  found_us_via: string | null;
  expectations: string | null;
};

const FIELDS: Array<{
  key: keyof PracticeNotesProps;
  label: string;
  fallback: string;
}> = [
  {
    key: "physical_limitations",
    label: "Physical limitations",
    fallback: "None on file.",
  },
  {
    key: "prior_experience",
    label: "Prior experience",
    fallback: "Not noted.",
  },
  {
    key: "found_us_via",
    label: "How you found us",
    fallback: "Not noted.",
  },
  {
    key: "expectations",
    label: "What you hope to gain",
    fallback: "Not noted.",
  },
];

export function PracticeNotes(props: PracticeNotesProps) {
  // Hide the whole section if every field is empty — the page already
  // has plenty of structure without a panel that says "Not noted." 4
  // times in a row.
  const anyContent = FIELDS.some((f) => !!props[f.key]?.trim());
  if (!anyContent) return null;

  return (
    <section
      aria-labelledby="practice-notes-title"
      className="relative mx-auto max-w-7xl px-6 md:px-10 pb-12"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 md:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-4">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            From your registration
          </p>
          <h2
            id="practice-notes-title"
            className="font-display text-3xl md:text-4xl tracking-tight leading-[1.05]"
          >
            About your{" "}
            <span className="italic text-vermillion">practice.</span>
          </h2>
          <p className="mt-4 text-sm text-foreground/60 leading-relaxed max-w-sm">
            What you wrote when you registered. Your instructors read this so
            they can support you well from day one.
          </p>
        </div>

        <dl className="col-span-12 md:col-span-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FIELDS.map(({ key, label, fallback }) => {
            const value = props[key]?.trim();
            const isEmpty = !value;
            return (
              <div key={key} className="break-inside-avoid">
                <dt className="text-[10px] uppercase tracking-[0.32em] text-foreground/55 mb-2">
                  {label}
                </dt>
                <dd
                  className={
                    isEmpty
                      ? "text-sm text-foreground/40 italic"
                      : "text-base text-foreground/85 leading-relaxed whitespace-pre-line"
                  }
                >
                  {isEmpty ? fallback : value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
