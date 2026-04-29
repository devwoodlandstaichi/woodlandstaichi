import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import {
  activateInstructor,
  deactivateInstructor,
  deleteInstructor,
} from "./actions";
import { InstructorFilters } from "./filters";

export const metadata = { title: "Instructors" };
export const dynamic = "force-dynamic";

type Tier = "founder" | "senior" | "instructor" | "assistant";
const TIER_VALUES: Tier[] = ["founder", "senior", "instructor", "assistant"];

type Status = "active" | "hidden" | "all";

function isTier(v: string | undefined): v is Tier {
  return !!v && (TIER_VALUES as readonly string[]).includes(v);
}
function asStatus(v: string | undefined): Status {
  return v === "hidden" || v === "all" ? v : "active";
}

type SearchParams = Promise<{
  q?: string;
  tier?: string;
  status?: string;
}>;

type Row = {
  id: string;
  name: string;
  tier: Tier;
  title: string | null;
  bio: string | null;
  display_order: number;
  active: boolean;
  photo_url: string | null;
};

const TIER_LABEL: Record<Tier, string> = {
  founder: "Founder · Group Director",
  senior: "Senior Instructor",
  instructor: "Instructor",
  assistant: "Assistant Instructor",
};

const TIER_BADGE_TONE: Record<Tier, "vermillion" | "cobalt" | "jade" | "muted"> = {
  founder: "vermillion",
  senior: "cobalt",
  instructor: "jade",
  assistant: "muted",
};

// Top-of-card gradient bands per tier — atmosphere, not data.
const TIER_BANNER: Record<Tier, string> = {
  founder:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--vermillion-500)_45%,transparent),color-mix(in_oklch,var(--vermillion-500)_15%,transparent))]",
  senior:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--cobalt-500)_40%,transparent),color-mix(in_oklch,var(--cobalt-500)_10%,transparent))]",
  instructor:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--jade-500)_35%,transparent),color-mix(in_oklch,var(--jade-500)_8%,transparent))]",
  assistant:
    "bg-[linear-gradient(135deg,color-mix(in_oklch,var(--ink-500)_18%,transparent),color-mix(in_oklch,var(--ink-500)_5%,transparent))]",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export default async function InstructorsAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tier = isTier(params.tier) ? params.tier : "";
  const status = asStatus(params.status);

  const supabase = await createClient();
  let query = supabase
    .from("instructors")
    .select("id,name,tier,title,bio,display_order,active,photo_url")
    .order("active", { ascending: false })
    .order("display_order", { ascending: true });

  if (status === "active") query = query.eq("active", true);
  else if (status === "hidden") query = query.eq("active", false);
  if (tier) query = query.eq("tier", tier);
  if (q) {
    // PostgREST ilike inside .or() needs `*` as the wildcard
    const safe = q.replace(/[,()*]/g, " ");
    query = query.or(
      [
        `name.ilike.*${safe}*`,
        `title.ilike.*${safe}*`,
        `bio.ilike.*${safe}*`,
      ].join(","),
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as Row[];

  const filtered = !!q || !!tier || status !== "active";

  return (
    <>
      <PageHeader
        title="Instructors"
        description="Volunteer instructor roster shown on the public Instructors page."
        action={
          <Link
            href="/admin/instructors/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> New instructor
          </Link>
        }
      />

      <InstructorFilters q={q} tier={tier as Tier | ""} status={status} />

      {rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          {filtered
            ? "No instructors match these filters."
            : "No instructors yet."}
        </Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pt-4">
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((r) => (
              <li key={r.id}>
                <InstructorCard instructor={r} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="-mx-4 shrink-0 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "instructor" : "instructors"}.
        </p>
      </div>
    </>
  );
}

function InstructorCard({ instructor: r }: { instructor: Row }) {
  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card shadow-sm transition-shadow hover:shadow-md ${
        !r.active ? "opacity-70" : ""
      }`}
    >
      {/* Banner — gradient by tier */}
      <div className={`relative h-14 ${TIER_BANNER[r.tier]}`}>
        {/* Display order pill, top-right */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-mono tabular-nums text-muted-foreground backdrop-blur">
          <Hash size={10} aria-hidden />
          {r.display_order}
        </span>
        {/* Inactive badge, top-left */}
        {!r.active && (
          <span className="absolute left-3 top-3">
            <Badge tone="muted">Hidden</Badge>
          </span>
        )}
      </div>

      {/* Avatar — overlaps the banner */}
      <div className="px-5 -mt-10">
        {r.photo_url ? (
          <Image
            src={r.photo_url}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover border-4 border-card shadow-sm"
          />
        ) : (
          <span
            aria-hidden
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-vermillion/10 text-vermillion font-display text-2xl border-4 border-card shadow-sm"
          >
            {initials(r.name)}
          </span>
        )}
      </div>

      {/* Identity */}
      <div className="px-5 pt-4">
        <h2 className="font-display text-xl font-medium leading-tight tracking-tight">
          {r.name}
        </h2>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {r.title ?? TIER_LABEL[r.tier]}
        </p>
        <div className="mt-3">
          <Badge tone={TIER_BADGE_TONE[r.tier]}>
            {tierShort(r.tier)}
          </Badge>
        </div>
      </div>

      {/* Bio */}
      <div className="px-5 pt-4 pb-5 flex-1">
        {r.bio ? (
          <p className="text-sm text-foreground/75 leading-relaxed line-clamp-4">
            {r.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No bio yet.
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-foreground/8 bg-foreground/[0.02] px-5 py-3 flex items-center justify-end gap-2">
        <Link
          href={`/admin/instructors/${r.id}/edit`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
        >
          <Pencil size={13} aria-hidden /> Edit
        </Link>
        <form action={r.active ? deactivateInstructor : activateInstructor}>
          <input type="hidden" name="id" value={r.id} />
          <Button type="submit" variant="ghost" size="sm">
            {r.active ? "Hide" : "Show"}
          </Button>
        </form>
        <form action={deleteInstructor}>
          <input type="hidden" name="id" value={r.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
          >
            Delete
          </Button>
        </form>
      </div>
    </article>
  );
}

function tierShort(t: Tier): string {
  return t === "founder"
    ? "Founder"
    : t === "senior"
      ? "Senior"
      : t === "instructor"
        ? "Instructor"
        : "Assistant";
}
