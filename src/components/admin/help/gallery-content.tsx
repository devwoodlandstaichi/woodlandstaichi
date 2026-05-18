import {
  Bullets,
  FaqItem,
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
} from "./primitives";

export function GalleryHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Gallery</strong> page manages the photos shown on
          the public <em>/gallery</em> page. Upload, reorder, hide, or
          delete &mdash; no code changes needed.
        </p>
      </Intro>

      <Section title="Storage limit" anchor="storage">
        <p>
          The header card shows how much space the gallery is using out
          of <strong>1 GB</strong> (the free-tier total across all
          buckets). Photos are auto-resized in your browser to
          2400&nbsp;pixels on the longest edge and re-encoded as JPEG
          before they upload, so phone originals drop from several
          megabytes to a few hundred kilobytes.
        </p>
        <Note>
          The meter turns vermillion past 80%. If you&rsquo;re near the
          cap, delete older photos before adding new ones.
        </Note>
      </Section>

      <Section title="Upload one or many photos" anchor="upload">
        <Steps>
          <Step n={1}>
            Click <Pill primary>Choose photos</Pill>.
          </Step>
          <Step n={2}>
            Pick one or more files. Hold ⌘ (Mac) or Ctrl (Windows) to
            select multiple at once.
          </Step>
          <Step n={3}>
            Each file shows its status: <em>Resizing → Uploading →
            Done</em>. Three files upload at a time; the rest wait in
            the queue. The new photos appear at the top of the grid.
          </Step>
        </Steps>
        <Note>
          The page determines landscape vs. portrait from the actual
          dimensions of each photo. If a photo looks cropped weird on
          the public page, click <em>Edit</em> on its tile and flip the
          orientation.
        </Note>
      </Section>

      <Section title="Edit alt text and orientation" anchor="edit">
        <p>
          Alt text is what screen readers announce and what shows under
          the photo in the lightbox. Even a few words helps:
          &ldquo;World Tai Chi Day 2024 &mdash; group practice&rdquo;
          is plenty.
        </p>
        <Steps>
          <Step n={1}>
            On the tile, click <Pill>Edit</Pill>.
          </Step>
          <Step n={2}>
            Type the alt text, pick Landscape or Portrait, toggle{" "}
            <em>Visible</em> if you want to temporarily hide the photo
            from the public site.
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Reorder photos" anchor="reorder">
        <p>
          Use the up/down arrows on each tile to swap it with the
          neighbour. Smaller order = appears first. The public page
          uses the same order.
        </p>
      </Section>

      <Section title="Hide vs. delete" anchor="hide-vs-delete">
        <Bullets>
          <li>
            <strong>Hide</strong> &mdash; uncheck <em>Visible</em> in the
            edit panel. The photo stays in storage but doesn&rsquo;t
            show publicly. Good for seasonal photos you might want
            again next year.
          </li>
          <li>
            <strong>Delete</strong> &mdash; click the trash icon. The
            photo is removed from the grid and its file is deleted from
            storage. Can&rsquo;t be undone &mdash; you&rsquo;ll need a
            new upload to restore it.
          </li>
        </Bullets>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What's a 'legacy' photo?">
          <p>
            When the gallery system first shipped, 11 photos already
            lived in the codebase under <em>/public/photos/</em>. Those
            rows show a <em>Legacy</em> badge in the admin grid. They
            display fine, but you can&rsquo;t replace the file directly
            &mdash; delete the row and re-upload from your computer to
            move it into the bucket.
          </p>
        </FaqItem>

        <FaqItem q="Why does my photo look stretched on the public page?">
          <p>
            The public page uses a fixed aspect ratio per tile (4:3 for
            landscape, 3:4 for portrait) and crops to fill. If the
            photo looks wrong, edit the tile and switch its orientation
            to match the actual photo.
          </p>
        </FaqItem>

        <FaqItem q="Can I rearrange dozens of photos at once?">
          <p>
            Not yet &mdash; reorder is one step at a time today. If
            that becomes a pain, ask a developer for a bulk reorder
            tool.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
