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

export function ClassesHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Classes</strong> page is the school&rsquo;s
          recurring schedule. Each row is a class that meets every week
          (e.g. &ldquo;Beginners, Wednesdays 8&ndash;9 a.m. at
          TWMC&rdquo;). What you set here is what appears on the public
          schedule on the website.
        </p>
      </Intro>

      <Section title="Add a new class" anchor="new">
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ New class</Pill> at the top right.
          </Step>
          <Step n={2}>
            Fill in:
            <Bullets>
              <li>
                <strong>Name</strong> &mdash; e.g. &ldquo;Beginners
                Wednesday Morning&rdquo;.
              </li>
              <li>
                <strong>Day of the week</strong> and{" "}
                <strong>time</strong>.
              </li>
              <li>
                <strong>Location</strong> &mdash; e.g. TWMC, KBCC, LSC.
              </li>
              <li>
                <strong>Level</strong> &mdash; Beginners, Intermediate,
                Advanced, Remedial, Play-only, or Combined.
              </li>
              <li>
                <strong>Capacity</strong> &mdash; how many students fit
                in the room.
              </li>
            </Bullets>
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Edit a class" anchor="edit">
        <Steps>
          <Step n={1}>
            <strong>Click the class name</strong> in the list.
          </Step>
          <Step n={2}>Change what you need to change.</Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
        <Note>
          Edits are live on the public website immediately. Future
          sessions of this class also pick up the changes.
        </Note>
      </Section>

      <Section title="Hide a class from the public" anchor="archive">
        <p>
          Done with a class for the season? Archive it instead of
          deleting.
        </p>
        <Steps>
          <Step n={1}>Find the class in the list.</Step>
          <Step n={2}>
            Click <Pill>Archive</Pill> on that row.
          </Step>
        </Steps>
        <p>
          The class disappears from the public schedule. You still see
          it in the admin list with an <em>Archived</em> tag. Click{" "}
          <Pill>Unarchive</Pill> to bring it back.
        </p>
      </Section>

      <Section title="Delete a class" anchor="delete">
        <Steps>
          <Step n={1}>Find the class in the list.</Step>
          <Step n={2}>
            Click <Pill destructive>Delete</Pill>.
          </Step>
          <Step n={3}>Confirm.</Step>
        </Steps>
        <Warning>
          Deleting removes all sessions and registrations attached to
          this class. Permanent. If you might need it back, archive
          instead.
        </Warning>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What's the difference between a class and a session?">
          <p>
            A <strong>class</strong> is the recurring template (every
            Wednesday 8 a.m.). A <strong>session</strong> is one
            specific date (June 3 at 8 a.m.). Sessions are managed on
            the Sessions page; they&rsquo;re generated from classes.
          </p>
        </FaqItem>

        <FaqItem q="Why can't I find a class on the public schedule?">
          <p>It&rsquo;s probably archived. Check the Classes admin list and look for an &ldquo;Archived&rdquo; tag. Click Unarchive.</p>
        </FaqItem>

        <FaqItem q="Why are some classes hidden from the public list but shown in admin?">
          <p>
            One-off events created from the Sessions page have a
            hidden parent class. That parent only exists so the
            session can attach to something. They don&rsquo;t belong
            on the recurring schedule.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
