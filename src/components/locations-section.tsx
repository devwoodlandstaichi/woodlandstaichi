import { MapPin } from "lucide-react";

const LOCATIONS = [
  {
    name: "The Woodlands Methodist Church",
    address: "1915 Lake Front Circle",
    city: "The Woodlands, TX",
    days: ["Wednesday", "Friday"],
  },
  {
    name: "Kevin Brady Community Center",
    address: "2250 Buckthorne Pl",
    city: "The Woodlands, TX",
    days: ["Thursday"],
  },
];

export function LocationsSection() {
  return (
    <section
      id="locations"
      aria-labelledby="locations-title"
      className="relative mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 md:col-span-5">
          <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Where we meet
          </p>
          <h2
            id="locations-title"
            className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
          >
            Two rooms,
            <span className="block italic text-vermillion">same calm.</span>
          </h2>
          <p className="mt-8 text-lg text-foreground/75 leading-relaxed">
            Both venues are open, accessible, and parking is free. Wear soft
            soles — no special uniform required for your first visit.
          </p>
        </div>

        <div className="col-span-12 md:col-span-7 md:pl-8 grid gap-6">
          {LOCATIONS.map((loc) => {
            const query = encodeURIComponent(`${loc.name}, ${loc.address}, ${loc.city}`);
            return (
              <a
                key={loc.name}
                href={`https://www.google.com/maps/search/?api=1&query=${query}`}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-xl border border-foreground/10 bg-card p-7 transition-colors hover:border-vermillion/40"
              >
                <span
                  aria-hidden
                  className="absolute right-7 top-7 inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground/70 transition-colors group-hover:bg-vermillion group-hover:text-background"
                >
                  <MapPin size={18} />
                </span>
                <h3 className="font-display text-2xl tracking-tight pr-14">
                  {loc.name}
                </h3>
                <p className="mt-2 text-foreground/70">{loc.address}</p>
                <p className="text-foreground/60 text-sm">{loc.city}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {loc.days.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-foreground/5 px-3 py-1 text-xs tracking-wide text-foreground/75"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-vermillion">
                  Open in Maps
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
