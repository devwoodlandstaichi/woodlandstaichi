"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { loadGalleryPage } from "@/app/admin/gallery/actions";

export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  aspect: "landscape" | "portrait";
};

const PAGE_SIZE = 24;

// Masonry-style column flow with infinite scroll + click-to-open
// lightbox. The lightbox is hand-rolled to fit the editorial-quiet
// aesthetic and skip the dependency cost of a general-purpose
// library. Server pre-renders the first PAGE_SIZE photos; subsequent
// pages stream in via a server action when the user scrolls near the
// sentinel.

export function GalleryGrid({
  initialPhotos,
  initialHasMore,
}: {
  initialPhotos: GalleryPhoto[];
  initialHasMore: boolean;
}) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const next = await loadGalleryPage(photos.length, PAGE_SIZE);
      if (next.photos.length > 0) {
        setPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const fresh = next.photos.filter((p) => !seen.has(p.id));
          return [...prev, ...fresh];
        });
      }
      setHasMore(next.hasMore);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, photos.length]);

  // Sentinel becomes visible → fetch next page. rootMargin pre-loads
  // before the user actually hits the bottom so the scroll feels
  // continuous.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const close = useCallback(() => setOpenIdx(null), []);
  const prev = useCallback(
    () =>
      setOpenIdx((i) =>
        i === null ? null : (i - 1 + photos.length) % photos.length,
      ),
    [photos.length],
  );
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length],
  );

  // Keyboard nav + body scroll lock when the lightbox is open.
  useEffect(() => {
    if (openIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIdx, close, prev, next]);

  const current = openIdx === null ? null : photos[openIdx];

  return (
    <>
      <ul className="columns-1 sm:columns-2 lg:columns-3 gap-6 [&>li]:break-inside-avoid [&>li]:mb-6">
        {photos.map((photo, i) => (
          <li
            key={photo.id}
            className="overflow-hidden rounded-xl border border-foreground/10 bg-card"
          >
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              className="group block w-full text-left focus:outline-none"
              aria-label={`Open photo ${i + 1} of ${photos.length}: ${photo.alt}`}
            >
              <div
                className={`relative w-full ${
                  photo.aspect === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  priority={i < 3}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Sentinel + loading indicator. Stays mounted while there are
          more pages; once hasMore flips to false we remove it. */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="mt-6 flex items-center justify-center py-6 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Loading more photos…
            </span>
          ) : (
            <span className="opacity-0">Loading more photos…</span>
          )}
        </div>
      )}

      {current && openIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/15 text-background hover:bg-background/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
          >
            <X size={20} aria-hidden />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/15 text-background hover:bg-background/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
              >
                <ChevronLeft size={26} aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex h-12 w-12 items-center justify-center rounded-full bg-background/15 text-background hover:bg-background/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-background/60"
              >
                <ChevronRight size={26} aria-hidden />
              </button>
            </>
          )}

          <figure
            className="relative max-h-[88vh] max-w-[92vw] sm:max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.src}
              alt={current.alt}
              width={2400}
              height={1800}
              sizes="92vw"
              className="h-auto max-h-[88vh] w-auto object-contain"
              priority
            />
            {current.alt && (
              <figcaption className="mx-auto mt-3 max-w-prose text-center text-sm text-background/85">
                {current.alt}
              </figcaption>
            )}
            <p className="mt-1 text-center text-xs tabular-nums text-background/55">
              {openIdx + 1} / {photos.length}
              {hasMore && "+"}
            </p>
          </figure>
        </div>
      )}
    </>
  );
}
