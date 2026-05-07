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

export function RsvpsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>RSVPs</strong> page is where members ask to
          attend a specific upcoming session that&rsquo;s outside their
          regular schedule. You decide who gets in.
        </p>
      </Intro>

      <Section title="The five tabs" anchor="tabs">
        <Bullets>
          <li>
            <strong>Pending</strong> &mdash; new requests waiting for
            your decision. <em>Start here.</em>
          </li>
          <li>
            <strong>Approved</strong> &mdash; members you&rsquo;ve let in.
          </li>
          <li>
            <strong>Waitlisted</strong> &mdash; queued in case a spot
            opens.
          </li>
          <li>
            <strong>Rejected</strong> &mdash; declined.
          </li>
          <li>
            <strong>All</strong> &mdash; everything together.
          </li>
        </Bullets>
      </Section>

      <Section title="Approve, waitlist, or reject" anchor="decide">
        <p>
          Requests are grouped by session, so you can decide on a whole
          group at once.
        </p>
        <Steps>
          <Step n={1}>
            Find the session in the list. Click <Pill>Open session</Pill>{" "}
            to see who&rsquo;s asking.
          </Step>
          <Step n={2}>
            For each member, choose:
            <Bullets>
              <li>
                <Pill primary>Approve</Pill> &mdash; they get in. They
                show up on that session&rsquo;s roster.
              </li>
              <li>
                <Pill>Waitlist</Pill> &mdash; in line for a spot if
                others drop. They&rsquo;re auto-promoted to Approved
                if capacity opens up.
              </li>
              <li>
                <Pill destructive>Reject</Pill> &mdash; declined.
              </li>
            </Bullets>
          </Step>
        </Steps>
        <Note>
          Approving someone whose level doesn&rsquo;t match the
          class&rsquo;s level is allowed &mdash; you&rsquo;re the human
          override. The system will warn you visually but let you do
          it.
        </Note>
      </Section>

      <Section title="Cancel an approval or waitlist spot" anchor="cancel">
        <p>If you change your mind after approving or waitlisting:</p>
        <Steps>
          <Step n={1}>Find the request (Approved or Waitlisted tab).</Step>
          <Step n={2}>
            Click <Pill>Cancel</Pill> on that row.
          </Step>
        </Steps>
        <p>
          The member is no longer on the session&rsquo;s roster. They
          can re-request if they want.
        </p>
      </Section>

      <Section title="Configure how RSVPs work" anchor="settings">
        <p>
          Two RSVP settings live on the{" "}
          <em>Settings &rarr; RSVP rules</em> page:
        </p>
        <Bullets>
          <li>
            <strong>Cutoff window</strong> &mdash; how soon before a
            session a member can stop requesting (default: 4 hours
            before start).
          </li>
          <li>
            <strong>Level visibility</strong> &mdash; which class
            levels each member tier can see and request. Beginners
            usually can&rsquo;t request Advanced sessions, etc.
          </li>
        </Bullets>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Does the member get an email when I approve?">
          <p>
            Yes &mdash; for approvals from waitlist (auto-promotion) and
            for explicit approves. Rejects don&rsquo;t notify by
            default to keep things low-pressure.
          </p>
        </FaqItem>

        <FaqItem q="Why can't I see a session that's coming up?">
          <p>
            Past sessions are filtered out. Only upcoming sessions that
            members are currently RSVPing for show on this page.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
