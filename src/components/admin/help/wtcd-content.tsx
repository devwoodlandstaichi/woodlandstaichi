import {
  Bullets,
  FaqItem,
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
  Warning,
} from "./primitives";

export function WtcdHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>World Tai Chi Day</strong> page is where you
          manage the school&rsquo;s annual celebrations &mdash; the
          poster, the date, the location, and a link to the photo
          gallery from past years.
        </p>
      </Intro>

      <Section title="Add a new year's event" anchor="new">
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ New event</Pill>.
          </Step>
          <Step n={2}>
            Fill in:
            <Bullets>
              <li>
                <strong>Year</strong> &mdash; e.g. 2026.
              </li>
              <li>
                <strong>Event date</strong> &mdash; the actual day.
              </li>
              <li>
                <strong>Location</strong>.
              </li>
              <li>
                <strong>Poster image</strong> (3:4 portrait works
                best).
              </li>
              <li>
                <strong>Gallery link</strong> (optional) &mdash; a
                shareable link to a photo album.
              </li>
              <li>
                <strong>Intro text</strong> (optional) &mdash; one or
                two sentences shown on the public page.
              </li>
            </Bullets>
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
        <Note>
          The next event by date (in the future) is automatically
          featured at the top of the public World Tai Chi Day page.
        </Note>
      </Section>

      <Section title="Edit an event" anchor="edit">
        <Steps>
          <Step n={1}>Click an event card to open it.</Step>
          <Step n={2}>Change what you need.</Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Hide an event" anchor="hide">
        <p>
          Old events stay around as a record. To remove one from the
          public page without losing it, toggle <Pill>Hide</Pill>.
        </p>
      </Section>

      <Section title="Delete an event" anchor="delete">
        <Steps>
          <Step n={1}>Open the event.</Step>
          <Step n={2}>
            Click <Pill destructive>Delete</Pill>.
          </Step>
        </Steps>
        <Warning>
          The poster image is removed too. There is no undo &mdash;
          consider hiding instead if you might want it back.
        </Warning>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What size should the poster be?">
          <p>
            Tall (portrait) photos work best, around 3:4 ratio. Anything
            from a phone is fine; the website resizes automatically.
          </p>
        </FaqItem>

        <FaqItem q="The next event isn't showing as 'upcoming' on the public page.">
          <p>
            Two things to check: the event must be marked <em>active</em>{" "}
            (not hidden), and its date must be today or later. Past
            events are listed below the current one rather than as the
            featured hero.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
