import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { GALLERY_PHOTOS } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Gallery — moments from the dojo",
  description:
    "Photos from Woodlands Tai Chi practice and World Tai Chi Day events through the years.",
};

export default function GalleryPage() {
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

        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <ul className="columns-1 sm:columns-2 lg:columns-3 gap-6 [&>li]:break-inside-avoid [&>li]:mb-6">
            {GALLERY_PHOTOS.map((photo, i) => (
              <li
                key={photo.src}
                className="overflow-hidden rounded-xl border border-foreground/10 bg-card"
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
                    className="object-cover"
                    priority={i < 3}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-foreground/55 italic max-w-prose">
            More photos to come — if you have practice photos you&apos;d like
            to share, send them along.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
