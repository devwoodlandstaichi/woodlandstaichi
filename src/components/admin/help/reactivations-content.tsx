import {
  FaqItem,
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
} from "./primitives";

export function ReactivationsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Reactivations</strong> page is where former
          members ask to come back. They submit their email through
          the public site; you decide whether to put them back on the
          active roster.
        </p>
      </Intro>

      <Section title="Approve and welcome them back" anchor="approve">
        <Steps>
          <Step n={1}>
            Open the Pending tab. New requests live here.
          </Step>
          <Step n={2}>
            Click <Pill primary>Approve &amp; email</Pill>.
          </Step>
        </Steps>
        <Note>
          One click does two things: their member status flips to{" "}
          <em>active</em> on the roster, AND a welcome-back email goes
          out automatically.
        </Note>
      </Section>

      <Section title="Decline a request" anchor="reject">
        <Steps>
          <Step n={1}>Find the row.</Step>
          <Step n={2}>
            Click <Pill destructive>Reject</Pill>. A box pops up where
            you can write a short note (only you see this; the member
            isn&rsquo;t notified of the reason).
          </Step>
          <Step n={3}>Confirm.</Step>
        </Steps>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Why does some requests show 'no account'?">
          <p>
            They typed an email we don&rsquo;t recognize from our
            roster. Could be a typo, a married name, or someone
            who&rsquo;s never been a member. Reach out personally to
            sort it out before approving.
          </p>
        </FaqItem>

        <FaqItem q="Can I approve without sending the email?">
          <p>
            Not from this page &mdash; the email is part of the action.
            If you really need silent activation, edit the
            member&rsquo;s status directly on the Members page instead.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
