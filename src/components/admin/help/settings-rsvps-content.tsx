import {
  FaqItem,
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
} from "./primitives";

export function SettingsRsvpsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          This page configures two things about the{" "}
          <strong>RSVP</strong> system: how late members can request a
          spot, and which class levels each tier of member can see.
        </p>
      </Intro>

      <Section title="The cutoff window" anchor="cutoff">
        <p>
          Sets how many minutes before a session starts the system
          stops accepting new RSVP requests. Default: <strong>240
          minutes</strong> (4 hours).
        </p>
        <Steps>
          <Step n={1}>
            Type a new number into the cutoff field. Minutes only.
          </Step>
          <Step n={2}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
        <Note>
          Lower numbers = members can RSVP closer to start time. Set
          this based on how much warning instructors need to plan
          rooms.
        </Note>
      </Section>

      <Section title="The level visibility matrix" anchor="matrix">
        <p>
          Different levels of members see different sets of classes
          when they look for sessions to RSVP to. Beginners
          shouldn&rsquo;t see Advanced sessions, etc.
        </p>
        <p>
          For each member tier (Beginner, Intermediate, Advanced,
          Instructor), check the boxes for the class levels they
          should be able to see and request.
        </p>
        <Steps>
          <Step n={1}>Set the boxes for each row.</Step>
          <Step n={2}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Does changing this affect existing RSVPs?">
          <p>
            No. Existing requests stay where they are. The change only
            affects what members can request from now on.
          </p>
        </FaqItem>

        <FaqItem q="What's a sensible default for the cutoff?">
          <p>
            Four hours covers most cases &mdash; instructors get the
            morning to plan a session that starts in the afternoon. If
            people complain RSVPs close too soon, drop it to 120
            (2 hours).
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
