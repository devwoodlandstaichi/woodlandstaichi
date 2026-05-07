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

export function SessionsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          A <strong>Session</strong> is one specific class on one
          specific date &mdash; for example, &ldquo;Wednesday Beginners
          at TWMC on June 3, 2026.&rdquo; This page lists all upcoming
          and past sessions and lets you manage capacity, mark which
          dates are open to brand-new students, and add one-off events.
        </p>
      </Intro>

      <Section title="Sessions vs. Classes" anchor="vs">
        <p>It helps to know the difference:</p>
        <Bullets>
          <li>
            A <strong>Class</strong> (on the Classes page) is the
            recurring schedule &mdash; e.g. &ldquo;Beginners, Wednesdays
            8&ndash;9 a.m. at TWMC.&rdquo;
          </li>
          <li>
            A <strong>Session</strong> is one date that class meets
            &mdash; e.g. &ldquo;Beginners on June 3.&rdquo;
          </li>
        </Bullets>
        <p>
          Editing a class affects all its future sessions. Editing one
          session affects only that date.
        </p>
      </Section>

      <Section title="Make sessions for the next few months" anchor="generate">
        <p>
          When a new term begins, you&rsquo;ll want to fill the calendar
          with all the upcoming dates at once.
        </p>
        <Steps>
          <Step n={1}>
            Click <Pill>Generate term</Pill> at the top of the page.
          </Step>
          <Step n={2}>
            Pick the start date and how many weeks to generate.
          </Step>
          <Step n={3}>Confirm.</Step>
        </Steps>
        <p>
          The system creates a session for every active class on every
          one of those dates. Existing sessions are not duplicated.
        </p>
      </Section>

      <Section title="Add a one-off event" anchor="event">
        <p>
          For special things outside the regular schedule &mdash; a
          workshop, a guest seminar, a holiday session.
        </p>
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ New event</Pill>.
          </Step>
          <Step n={2}>
            Fill in the date, time, level, and location. Give it a
            short name.
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
        <p>
          One-off events show up on the public schedule with an
          &ldquo;Event&rdquo; badge.
        </p>
      </Section>

      <Section title="Mark a session welcoming for newcomers" anchor="welcoming">
        <p>
          New students register for a specific upcoming session through
          the public Register page. Only sessions you&rsquo;ve marked{" "}
          <em>welcoming</em> show up there.
        </p>
        <Steps>
          <Step n={1}>Open the session you want to mark.</Step>
          <Step n={2}>
            Toggle the <Pill>Mark welcoming</Pill> button. A small
            sparkle badge appears next to the date.
          </Step>
        </Steps>
        <Note>
          Beginners typically only mark <em>the first one or two
          dates</em> of a class as welcoming. After that, late arrivals
          can&rsquo;t catch up to the form.
        </Note>
      </Section>

      <Section title="Set capacity for a session" anchor="capacity">
        <p>
          Each class has a default capacity. You can override it for a
          single session if, for example, you have a smaller room that
          day.
        </p>
        <Steps>
          <Step n={1}>Open the session.</Step>
          <Step n={2}>
            Type a number into the <em>Capacity override</em> field.
            Leave blank to use the class default.
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Delete a session" anchor="delete">
        <Steps>
          <Step n={1}>Open the session.</Step>
          <Step n={2}>
            Scroll to the bottom. Click <Pill destructive>Delete</Pill>.
          </Step>
        </Steps>
        <Warning>
          If anyone has scanned attendance for this session, deleting
          it removes those records too. Use with care.
        </Warning>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="A session is missing from the public schedule. Why?">
          <p>The most common causes:</p>
          <Bullets>
            <li>
              The class is archived (check the Classes page).
            </li>
            <li>
              The session date is in the past.
            </li>
            <li>
              For new-student visibility specifically: the session
              isn&rsquo;t marked <em>welcoming</em>.
            </li>
          </Bullets>
        </FaqItem>

        <FaqItem q="Can I cancel one date without deleting the class?">
          <p>
            Yes. Open the session and delete just that session. The
            class itself, and its other dates, are unaffected.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
