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

export function InstructorsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Instructors</strong> page is the list of
          teaching staff shown on the public website&rsquo;s
          Instructors page. Each card here becomes a profile on the
          public site.
        </p>
      </Intro>

      <Section title="Add an instructor" anchor="new">
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ New instructor</Pill>.
          </Step>
          <Step n={2}>
            Fill in:
            <Bullets>
              <li>
                <strong>Name</strong>
              </li>
              <li>
                <strong>Title</strong> &mdash; e.g. &ldquo;Senior
                Instructor&rdquo; or leave blank to use the tier name.
              </li>
              <li>
                <strong>Tier</strong> &mdash; Founder, Senior,
                Instructor, or Assistant. Sets visual styling on the
                public page.
              </li>
              <li>
                <strong>Photo</strong> &mdash; upload a square headshot.
              </li>
              <li>
                <strong>Bio</strong> &mdash; a few short paragraphs
                about them.
              </li>
              <li>
                <strong>Display order</strong> &mdash; lower numbers
                appear first.
              </li>
            </Bullets>
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Edit an instructor" anchor="edit">
        <Steps>
          <Step n={1}>
            <strong>Click their card</strong> in the grid.
          </Step>
          <Step n={2}>Change what you need to change.</Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
        <Note>
          Replacing the photo is the same as in News &mdash; click{" "}
          <Pill>Choose file</Pill> to pick a new one. The old photo is
          deleted automatically when you save.
        </Note>
      </Section>

      <Section title="Hide / show an instructor" anchor="visibility">
        <p>
          To take someone off the public page without deleting them
          (for example, while they&rsquo;re on a sabbatical):
        </p>
        <Steps>
          <Step n={1}>Find their card.</Step>
          <Step n={2}>
            Toggle <Pill>Hide</Pill>. They disappear from the public
            page; you still see them dimmed in the admin grid.
          </Step>
        </Steps>
        <p>
          Toggle <Pill>Show</Pill> to put them back.
        </p>
      </Section>

      <Section title="Reorder instructors" anchor="order">
        <p>
          The number in the corner of each card is the{" "}
          <em>display order</em>. Lower shows first. Edit any
          instructor to change the number.
        </p>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Should I use the same photo from the member roster?">
          <p>
            For active instructors who are also members, yes &mdash; it
            keeps them recognizable. But the instructor page often
            wants a more formal portrait, so you can upload a
            different one if you like.
          </p>
        </FaqItem>

        <FaqItem q="What's the difference between Senior Instructor and Instructor tier?">
          <p>
            It&rsquo;s a styling choice that signals seniority on the
            public page. Senior tier renders with a slightly more
            prominent visual treatment. The school&rsquo;s decision on
            who is which tier.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
