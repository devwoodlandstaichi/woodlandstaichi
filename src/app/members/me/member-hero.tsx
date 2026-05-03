import Image from "next/image";
import {
  Cake,
  Calendar,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { levelLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EditDetailsDialog } from "./edit-details-dialog";

type MemberHeroProps = {
  first_name: string;
  last_name: string;
  email: string;
  nickname: string | null;
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
  /** Slot for an interactive portrait component (e.g. PhotoForm).
   *  When provided, replaces the static PortraitFrame and the left
   *  column always renders regardless of photo_url. */
  portrait?: React.ReactNode;
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
  street: string | null,
  city: string | null,
  state: string | null,
  postal: string | null,
): string | null {
  const cityState: string[] = [];
  if (city) cityState.push(city);
  if (state) cityState.push(state);
  const cityLine = cityState.join(", ");
  const tail = postal ? `${cityLine} ${postal}`.trim() : cityLine;
  if (street && tail) return `${street}, ${tail}`;
  if (street) return street;
  return tail || null;
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
  const location = formatLocation(
    props.street,
    props.city,
    props.state,
    props.postal_code,
  );
  const hasBio = !!props.bio?.trim();
  const ec = formatEmergencyContact(
    props.emergency_contact_name,
    props.emergency_contact_relationship,
    props.emergency_phone,
  );

  return (
    <section
      aria-labelledby="member-hero-name"
      className="relative mx-auto max-w-7xl px-6 pt-6 pb-8 md:px-10 md:pt-8 md:pb-10 overflow-hidden"
    >
      <div className="relative grid grid-cols-12 gap-x-6 gap-y-6">
        {/* Portrait — uses the interactive `portrait` slot (e.g.
            PhotoForm) when caller supplies one, otherwise falls back to
            the static PortraitFrame, which only renders when an actual
            photo is on file (initials placeholder felt like dead
            weight, so we drop the whole column when there's nothing). */}
        {props.portrait ? (
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            {props.portrait}
          </div>
        ) : props.photo_url ? (
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <PortraitFrame
              photo_url={props.photo_url}
              alt={`Portrait of ${fullName}`}
              initials={initials(props.first_name, props.last_name)}
            />
          </div>
        ) : null}

        {/* Identity column */}
        <div
          className={cn(
            "col-span-12 flex flex-col",
            (props.portrait || props.photo_url) &&
              "md:col-span-8 lg:col-span-9 md:pl-5 lg:pl-8",
          )}
        >
          <p className="rise text-[11px] uppercase tracking-[0.45em] text-foreground/55 mb-3">
            <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
            Welcome, this is
          </p>

          <h1
            id="member-hero-name"
            className="font-display tracking-tight leading-[1] text-[clamp(1.875rem,4vw,3rem)]"
          >
            <span className="rise" style={{ animationDelay: "120ms" }}>
              {props.first_name}
            </span>{" "}
            <span
              className="rise italic text-vermillion"
              style={{ animationDelay: "240ms" }}
            >
              {props.last_name}.
            </span>
          </h1>

          <p
            className="rise mt-3 text-xs uppercase tracking-[0.36em] text-foreground/65"
            style={{ animationDelay: "360ms" }}
          >
            {subline}
          </p>

          {/* Bio or invitation */}
          <div
            className="rise mt-5 max-w-prose"
            style={{ animationDelay: "440ms" }}
          >
            {hasBio ? (
              <p className="text-[0.95rem] text-foreground/80 leading-[1.6]">
                {props.bio}
              </p>
            ) : (
              <p className="text-sm text-foreground/55 italic leading-[1.6]">
                You haven&rsquo;t written a bio yet.{" "}
                <EditDetailsDialog
                  variant="link"
                  defaults={{
                    nickname: props.nickname,
                    phone: props.phone,
                    street: props.street,
                    city: props.city,
                    state: props.state,
                    postal_code: props.postal_code,
                    bio: props.bio,
                  }}
                >
                  Add a few sentences →
                </EditDetailsDialog>
              </p>
            )}
          </div>

          {/* Iconified detail rows. Two-column grid; "Member since"
              and emergency contact tend to be the most-asked-about
              fields after the obvious contact ones, so they're in
              this row alongside Born / Phone / Email / Lives in. */}
          <dl
            className="rise mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 max-w-2xl"
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
                label="Address"
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
            className="rise mt-7 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-4"
            style={{ animationDelay: "600ms" }}
          >
            <EditDetailsDialog
              defaults={{
                nickname: props.nickname,
                phone: props.phone,
                street: props.street,
                city: props.city,
                state: props.state,
                postal_code: props.postal_code,
                bio: props.bio,
              }}
            />
            <ChipLink href="#share-story">Share your story</ChipLink>
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
        <dd className="text-sm text-foreground/85">{children}</dd>
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
