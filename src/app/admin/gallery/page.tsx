import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, PageHeader } from "@/components/admin/ui";
import { GalleryUploader } from "./uploader";
import { PhotoTile } from "./photo-tile";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

const STORAGE_CAP_BYTES = 1024 * 1024 * 1024; // 1 GB free-tier total
const PAGE_SIZE = 24;

type Row = {
  id: string;
  image_url: string;
  image_path: string | null;
  alt: string;
  aspect: "landscape" | "portrait";
  sort_order: number;
  active: boolean;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

async function bucketUsage(): Promise<{ bytes: number; files: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("gallery")
    .list("", { limit: 1000 });
  if (error || !data) return { bytes: 0, files: 0 };
  const bytes = data.reduce((sum, o) => {
    const size = (o.metadata as { size?: number } | null)?.size ?? 0;
    return sum + size;
  }, 0);
  return { bytes, files: data.length };
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function GalleryAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const [photosRes, usage] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select("id,image_url,image_path,alt,aspect,sort_order,active", {
        count: "exact",
      })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    bucketUsage(),
  ]);

  const photos = (photosRes.data ?? []) as unknown as Row[];
  const total = photosRes.count ?? photos.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = offset + photos.length;

  const usedPct = Math.min(100, (usage.bytes / STORAGE_CAP_BYTES) * 100);
  const tone =
    usedPct < 60
      ? "bg-jade"
      : usedPct < 85
      ? "bg-cobalt"
      : "bg-vermillion";

  return (
    <>
      <PageHeader
        title="Gallery"
        description={`${total} photo${total === 1 ? "" : "s"} · ${usage.files} in bucket`}
        helpTopic="gallery"
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-6">
        <div className="space-y-6">
          {/* Storage meter */}
          <Card className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Storage
                </p>
                <p className="mt-1 font-display text-lg leading-tight">
                  <span className="tabular-nums">{formatBytes(usage.bytes)}</span>{" "}
                  <span className="text-foreground/55">
                    of {formatBytes(STORAGE_CAP_BYTES)} used
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                {usedPct.toFixed(1)}%
              </p>
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(usedPct)}
            >
              <div
                className={`h-full ${tone}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-foreground/60">
              Free-tier Supabase Storage caps at 1 GB total across all
              buckets. Uploads are auto-resized to 2400px on the longest
              edge and re-encoded as JPEG before they leave your browser,
              so a phone photo lands at roughly 300–600 KB.
              {usedPct >= 80 && (
                <span className="ml-1 font-medium text-vermillion">
                  You&rsquo;re past 80% — consider removing older photos
                  before adding new ones.
                </span>
              )}
            </p>
          </Card>

          {/* Uploader */}
          <GalleryUploader />

          {/* Grid */}
          {total === 0 ? (
            <Card className="px-5 py-12 text-center text-sm text-muted-foreground">
              No photos yet. Add some from the uploader above.
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>
                  Showing {showingFrom}–{showingTo} of {total}
                </span>
                {totalPages > 1 && (
                  <span>
                    Page {safePage} of {totalPages}
                  </span>
                )}
              </div>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((p, i) => (
                  <PhotoTile
                    key={p.id}
                    photo={p}
                    // Reorder buttons disable at the absolute edges
                    // (first row globally, last row globally) — not the
                    // edges of the visible page. So pass disabled only
                    // when offset/i match the global extreme.
                    isFirst={offset + i === 0}
                    isLast={offset + i === total - 1}
                  />
                ))}
              </ul>

              {totalPages > 1 && <Pager page={safePage} totalPages={totalPages} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Pager({ page, totalPages }: { page: number; totalPages: number }) {
  const prev = page > 1 ? `/admin/gallery?page=${page - 1}` : null;
  const next = page < totalPages ? `/admin/gallery?page=${page + 1}` : null;
  const linkBase =
    "inline-flex h-9 items-center gap-1.5 rounded-md border border-foreground/15 bg-card px-3 text-sm hover:bg-foreground/5";
  const disabled =
    "inline-flex h-9 items-center gap-1.5 rounded-md border border-foreground/10 px-3 text-sm text-foreground/40";

  return (
    <nav
      aria-label="Gallery pages"
      className="mt-4 flex items-center justify-between"
    >
      {prev ? (
        <Link href={prev} className={linkBase}>
          <ChevronLeft size={14} aria-hidden /> Previous
        </Link>
      ) : (
        <span className={disabled}>
          <ChevronLeft size={14} aria-hidden /> Previous
        </span>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>
      {next ? (
        <Link href={next} className={linkBase}>
          Next <ChevronRight size={14} aria-hidden />
        </Link>
      ) : (
        <span className={disabled}>
          Next <ChevronRight size={14} aria-hidden />
        </span>
      )}
    </nav>
  );
}
