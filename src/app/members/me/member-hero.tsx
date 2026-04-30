import Image from "next/image";
import {
  Cake,
  Calendar,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import { levelLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

type MemberHeroProps = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  birthday: string | null;
  level: string;
  status: string;
  bio: string | null;
  photo_url: string | null;
  created_at?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_phone?: string | null;
};

const STATUS_COPY: Record<string, string> = {
  active: "Active member",
  waitlist: "On the waitlist",
  inactive: "Inactive",
};

function initials(first: string, last: string): string {
  const f = first.trim().charAt(0).toUpperCase();
  const l = last.trim().charAt(0).toUpperCase();
  return `${f}${l}` || "—";
}

function formatBirthday(iso: string | null): string | null {
  if (!iso) return null;
  // Plain YYYY-MM-DD; build a Date in UTC to dodge timezone-offset
  // surprises that push the day backward in some locales.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatLocation(
  city: string | null,
  state: string | null,
  postal: string | null,
): string | null {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  const head = parts.join(", ");
  if (postal) return head ? `${head} ${postal}` : postal;
  return head || null;
}

function memberSinceYear(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const y = new Date(createdAt).getUTCFullYear();
  return Number.isFinite(y) ? String(y) : null;
}

function formatEmergencyContact(
  name: string | null | undefined,
  relationship: string | null | undefined,
  phone: string | null | undefined,
): { primary: string; secondary: string } | null {
  if (!name && !phone) return null;
  const primary = name?.trim() || phone || "";
  const relParts: string[] = [];
  if (relationship?.trim()) relParts.push(relationship.trim());
  if (phone && name) relParts.push(phone);
  return { primary, secondary: relParts.join(" · ") };
}

export function MemberHero(props: MemberHeroProps) {
  const fullName = `${props.first_name} ${props.last_name}`.trim();
  const subline = `${levelLabel(props.level)} · ${
    STATUS_COPY[props.status] ?? props.status
  }`;
  const since = memberSinceYear(props.created_at ?? null);
  const birthday = formatBirthday(props.birthday);
  const location = formatLocation(props.city, props.state, props.postal_code);
  const hasBio = !!props.bio?.trim();
  const ec = formatEmergencyContact(
    props.emergency_contact_name,
    props.emergency_contact_relationship,
    props.emergency_phone,
  );

  return (
    <section
      aria-labelledby="member-hero-name"
      className="relative mx-auto max-w-7xl px-6 pt-8 pb-12 md:px-10 md:pt-12 md:pb-16 overflow-hidden"
    >
      {/* CJK watermark — self (己) — same idiom as PageHeader,
          anchored to inner content right edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 hidden md:block font-display leading-none select-none text-foreground/[0.06] text-[clamp(20rem,32vw,38rem)] tracking-tighter md:right-10"
      >
        己
      </span>

      <div className="relative grid grid-cols-12 gap-x-6 gap-y-10">
        {/* Portrait / placeholder */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4">
          <PortraitFrame
            photo_url={props.photo_url}
            alt={`Portrait of ${fullName}`}
            initials={initials(props.first_name, props.last_name)}
          />
        </div>

        {/* Identity column */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 md:pl-6 lg:pl-10 flex flex-col">
          <p className="rise text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-6">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Welcome, this is
          </p>

          <h1
            id="member-hero-name"
            className="font-display tracking-tight leading-[0.95] text-[clamp(3rem,7.5vw,6rem)]"
          >
            <span
              className="rise block"
              style={{ animationDelay: "120ms" }}
            >
              {props.first_name}
            </span>
            <span
              className="rise block italic text-vermillion"
              style={{ animationDelay: "240ms" }}
            >
              {props.last_name}.
            </span>
          </h1>

          <p
            className="rise mt-6 text-xs uppercase tracking-[0.36em] text-foreground/65"
            style={{ animationDelay: "360ms" }}
          >
            {subline}
          </p>

          {/* Bio or invitation */}
          <div
            className="rise mt-8 max-w-prose"
            style={{ animationDelay: "440ms" }}
          >
            {hasBio ? (
              <p className="text-base text-foreground/80 leading-[1.7]">
                {props.bio}
              </p>
            ) : (
              <p className="text-base text-foreground/55 italic leading-[1.7]">
                You haven&rsquo;t written a bio yet.{" "}
                <a
                  href="#edit-details"
                  className="not-italic underline decoration-vermillion underline-offset-4 text-foreground hover:text-vermillion transition-colors"
                >
                  Add a few sentences →
                </a>
              </p>
            )}
          </div>

          {/* Iconified detail rows. Two-column grid; "Member since"
              and emergency contact tend to be the most-asked-about
              fields after the obvious contact ones, so they're in
              this row alongside Born / Phone / Email / Lives in. */}
          <dl
            className="rise mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 max-w-2xl"
            style={{ animationDelay: "520ms" }}
          >
            {since && (
              <DetailRow
                icon={<Calendar size={16} aria-hidden />}
                label="Member since"
              >
                {since}
              </DetailRow>
            )}
            {birthday && (
              <DetailRow icon={<Cake size={16} aria-hidden />} label="Born">
                {birthday}
              </DetailRow>
            )}
            {props.phone && (
              <DetailRow icon={<Phone size={16} aria-hidden />} label="Phone">
                <a
                  href={`tel:${props.phone.replace(/\D/g, "")}`}
                  className="hover:text-vermillion transition-colors"
                >
                  {props.phone}
                </a>
              </DetailRow>
            )}
            <DetailRow icon={<Mail size={16} aria-hidden />} label="Email">
              <a
                href={`mailto:${props.email}`}
                className="hover:text-vermillion transition-colors break-all"
              >
                {props.email}
              </a>
            </DetailRow>
            {location && (
              <DetailRow
                icon={<MapPin size={16} aria-hidden />}
                label="Lives in"
              >
                {location}
              </DetailRow>
            )}
            {ec && (
              <DetailRow
                icon={<HeartHandshake size={16} aria-hidden />}
                label="In case of emergency"
              >
                <span className="block">{ec.primary}</span>
                {ec.secondary && (
                  <span className="block text-xs text-foreground/55 mt-0.5">
                    {ec.secondary}
                  </span>
                )}
              </DetailRow>
            )}
          </dl>

          {/* Action chip row */}
          <div
            className="rise mt-12 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-6"
            style={{ animationDelay: "600ms" }}
          >
            <ChipLink href="#edit-details">Edit details</ChipLink>
            <ChipLink href="#share-story">Share your story</ChipLink>
            <form action={signOut} className="ml-auto">
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full border border-foreground/12 px-4 text-sm text-foreground/65 hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortraitFrame({
  photo_url,
  alt,
  initials,
}: {
  photo_url: string | null;
  alt: string;
  initials: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-2xl",
        "ring-1 ring-foreground/10",
        "bg-gradient-to-br from-vermillion/8 via-card to-cobalt/8",
      )}
    >
      {photo_url ? (
        <Image
          src={photo_url}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 42vw, 100vw"
          className="object-cover"
          priority
        />
      ) : (
        <>
          {/* Large CJK glyph watermark inside the frame. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-display leading-none select-none text-foreground/[0.07]"
            style={{ fontSize: "clamp(10rem, 24vw, 20rem)" }}
          >
            己
          </span>
          {/* Initials in italic Fraunces, vermillion. */}
          <span
            className="absolute inset-0 flex items-center justify-center font-display italic text-vermillion leading-none tracking-tight"
            style={{ fontSize: "clamp(5rem, 12vw, 9rem)" }}
            aria-hidden
          >
            {initials}
          </span>
        </>
      )}
      {/* Bottom rule — quiet vermillion underline as a frame detail. */}
      <span
        aria-hidden
        className="absolute inset-x-6 bottom-5 h-px bg-vermillion/40"
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-vermillion/25 bg-vermillion/5 text-vermillion shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.28em] text-foreground/50 mb-0.5">
          {label}
        </dt>
        <dd className="text-base text-foreground/85">{children}</dd>
      </div>
    </div>
  );
}

function ChipLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-foreground text-background px-4 text-sm font-medium hover:bg-vermillion transition-colors"
    >
      {children}
      <span aria-hidden>↓</span>
    </a>
  );
}
