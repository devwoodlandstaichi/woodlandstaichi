import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, PageHeader } from "@/components/admin/ui";
import { formatDate, todayIsoInSchoolTz } from "@/lib/format";
import {
  activateEvent,
  deactivateEvent,
  deleteEvent,
} from "./actions";

export const metadata = { title: "World Tai Chi Day" };
export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  year: number;
  event_date: string;
  location: string;
  intro: string | null;
  poster_url: string | null;
  gallery_url: string | null;
  active: boolean;
};

export default async function WtcdAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wtcd_events")
    .select(
      "id,year,event_date,location,intro,poster_url,gallery_url,active",
    )
    .order("event_date", { ascending: false });

  const rows = (data ?? []) as EventRow[];
  const todayIso = todayIsoInSchoolTz();

  return (
    <>
      <PageHeader
        title="World Tai Chi Day"
        description="One row per year. The public /world-tai-chi-day page reads from this list and auto-rolls the upcoming hero based on event date."
        helpTopic="wtcd"
        action={
          <Link
            href="/admin/wtcd/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium tracking-wide text-primary-foreground shadow hover:bg-primary/90"
          >
            <Plus size={16} aria-hidden /> New event
          </Link>
        }
      />

      {rows.length === 0 ? (
        <Card className="mt-4 p-8 text-center text-muted-foreground">
          No events yet. Create one to populate the public page.
        </Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pt-2">
          <ul role="list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((e) => {
              const upcoming = e.active && e.event_date >= todayIso;
              return (
                <li key={e.id}>
                  <article
                    className={`flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md ${
                      upcoming
                        ? "border-vermillion/40 ring-1 ring-vermillion/20"
                        : "border-foreground/10"
                    }`}
                  >
                    <div className="relative aspect-[3/4] bg-secondary">
                      {e.poster_url ? (
                        <Image
                          src={e.poster_url}
                          alt={`${e.year} poster`}
                          fill
                          sizes="(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-4xl text-muted-foreground">
                          {e.year}
                        </div>
                      )}
                      <div className="absolute right-3 top-3 flex gap-1.5">
                        {upcoming && <Badge tone="vermillion">Upcoming</Badge>}
                        {!e.active && <Badge tone="muted">Hidden</Badge>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 px-5 py-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-display text-2xl tracking-tight">
                          {e.year}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-muted-foreground">
                          {formatDate(e.event_date)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {e.location}
                      </p>
                      {e.gallery_url && (
                        <a
                          href={e.gallery_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-vermillion hover:underline"
                        >
                          <ExternalLink size={12} aria-hidden /> Gallery link
                        </a>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-end gap-1.5 border-t border-foreground/5 px-5 py-3">
                      <Link
                        href={`/admin/wtcd/${e.id}/edit`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent/10 hover:border-accent"
                      >
                        <Pencil size={14} aria-hidden /> Edit
                      </Link>
                      <form action={e.active ? deactivateEvent : activateEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {e.active ? "Hide" : "Show"}
                        </Button>
                      </form>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          aria-label={`Delete ${e.year} event`}
                          title="Delete (poster file is removed too)"
                        >
                          <Trash2 size={14} aria-hidden />
                        </Button>
                      </form>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="-mx-4 shrink-0 border-t border-foreground/10 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <p className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? "event" : "events"}.
        </p>
      </div>
    </>
  );
}
