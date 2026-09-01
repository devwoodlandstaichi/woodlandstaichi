import {
  Bullets,
  FaqItem,
  Intro,
  Note,
  Section,
} from "./primitives";

export function OverviewHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Overview</strong> page (also the home of the
          admin area) is your daily snapshot. It tells you what needs
          attention without making you click into every section.
        </p>
      </Intro>

      <Section title="What the tiles mean" anchor="tiles">
        <p>
          Each tile shows a number and links to the page where you act
          on it. Common ones:
        </p>
        <Bullets>
          <li>
            <strong>Pending payments</strong> &mdash; new registrations
            waiting to be marked paid. Click to open the Registrations
            queue.
          </li>
          <li>
            <strong>Unpaid orders</strong> &mdash; merchandise orders
            awaiting payment.
          </li>
          <li>
            <strong>Reactivation requests</strong> &mdash; former
            members asking to return.
          </li>
          <li>
            <strong>Testimonials awaiting review</strong> &mdash;
            member-submitted quotes pending your approval.
          </li>
          <li>
            <strong>News drafts</strong> &mdash; stories you started
            but haven&rsquo;t published.
          </li>
          <li>
            <strong>RSVPs awaiting review</strong> &mdash; people asking
            to attend a special session.
          </li>
        </Bullets>
        <Note>
          A tile showing zero means nothing&rsquo;s waiting on you.
          That&rsquo;s a good thing.
        </Note>
      </Section>

      <Section title="Today's classes" anchor="today">
        <p>
          Below the tiles, a list of classes happening today. Each
          shows the location, time, and how many people have already
          checked in. Click any of them to open the attendance scanner.
        </p>
      </Section>

      <Section title="Membership lifecycle" anchor="lifecycle">
        <p>
          Below the action tiles is a <strong>Lifecycle</strong> panel
          that counts how membership shifted over a period &mdash; how
          many members newly became Active, Waitlist, No-show, Dropped
          out, or Inactive, plus registrations newly put on hold. Unlike
          the tiles above (which are &ldquo;right now&rdquo; counts),
          these numbers move with the time range.
        </p>
        <Bullets>
          <li>
            Use the range control to switch between <strong>Week</strong>,{" "}
            <strong>Month</strong>, <strong>YTD</strong> (year to date),
            or a <strong>Custom</strong> from/to range.
          </li>
          <li>
            Click a lifecycle number to jump to the matching filtered
            list (e.g. the members who changed status in that window).
          </li>
        </Bullets>
        <Note>
          This is your &ldquo;how are we trending&rdquo; view &mdash;
          good for spotting a run of drop-outs or a healthy stretch of
          new sign-ups.
        </Note>
      </Section>

      <Section title="Attendance trend chart" anchor="chart">
        <p>
          The chart shows attendance counts for sessions over the last
          30 days. Helps spot dips early &mdash; if Wednesday morning
          numbers drop two weeks in a row, you might want to reach out.
        </p>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Where do I start each day?">
          <p>
            Right here. Look at the tiles. Any tile with a non-zero
            number is something to handle. Click in, do the work, come
            back.
          </p>
        </FaqItem>

        <FaqItem q="Can I customize what tiles show?">
          <p>
            Not yet. The tiles cover the school&rsquo;s most common
            daily tasks. Tell us if there&rsquo;s a number you check
            often that&rsquo;s missing &mdash; we can add it.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
