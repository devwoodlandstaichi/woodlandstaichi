import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { GalleryGrid } from "@/components/gallery-grid";
import { loadGalleryPage } from "@/app/admin/gallery/actions";

export const metadata: Metadata = {
  title: "Gallery — moments from the dojo",
  description:
    "Photos from Woodlands Tai Chi practice and World Tai Chi Day events through the years.",
};

export const dynamic = "force-dynamic";

const INITIAL_PAGE_SIZE = 24;

export default async function GalleryPage() {
  const { photos, hasMore } = await loadGalleryPage(0, INITIAL_PAGE_SIZE);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Gallery"
          title="Moments"
          italic="from the dojo."
          intro="Photographs from regular practice and our annual outdoor gatherings. Some moments only make sense afterwards."
          glyph="影"
        />

        <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
          {photos.length === 0 ? (
            <p className="text-sm text-foreground/60 italic max-w-prose">
              Photos coming soon.
            </p>
          ) : (
            <GalleryGrid initialPhotos={photos} initialHasMore={hasMore} />
          )}

          <p className="mt-6 text-sm text-foreground/55 italic max-w-prose">
            More photos to come — if you have practice photos you&apos;d like
            to share, send them along.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
