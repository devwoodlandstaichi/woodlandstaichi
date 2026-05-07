import {
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
  Warning,
  FaqItem,
} from "./primitives";

export function SettingsKioskHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Kiosk PIN</strong> is a short numeric code that
          protects the attendance scanner from being closed by
          students. Set it on a shared device, and the device will ask
          for the PIN before letting anyone leave the scanner screen.
        </p>
      </Intro>

      <Section title="Set or change the PIN" anchor="set">
        <Steps>
          <Step n={1}>
            Type a 4&ndash;8 digit number in the PIN field.
          </Step>
          <Step n={2}>
            Click <Pill primary>Save PIN</Pill>.
          </Step>
        </Steps>
        <Note>
          Saving replaces any previous PIN. There&rsquo;s no
          confirmation prompt &mdash; the new PIN is active
          immediately.
        </Note>
      </Section>

      <Section title="Remove the PIN" anchor="clear">
        <Steps>
          <Step n={1}>
            Click <Pill>Clear PIN</Pill>.
          </Step>
        </Steps>
        <p>
          With no PIN set, anyone can close the kiosk scanner. Useful
          for quick demos or when only staff use the device.
        </p>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Where is the PIN actually used?">
          <p>
            On a shared phone or tablet running the attendance scanner,
            the screen has a small &ldquo;Exit&rdquo; option. Tapping
            it asks for the PIN. Without the PIN, students can&rsquo;t
            close the scanner and access the rest of the admin.
          </p>
        </FaqItem>

        <FaqItem q="Is the PIN secure?">
          <p>
            It&rsquo;s stored hashed (not plain text), so the database
            being leaked wouldn&rsquo;t reveal the PIN. That said,
            it&rsquo;s 4&ndash;8 digits &mdash; treat it like a
            convenience lock, not a vault.
          </p>
        </FaqItem>

        <FaqItem q="I forgot the PIN.">
          <p>
            Sign in here from a separate device, click Clear PIN, then
            set a new one.
          </p>
        </FaqItem>
      </Section>

      <Warning>
        Don&rsquo;t share the PIN with members. The whole point is to
        keep them in the scanner.
      </Warning>
    </>
  );
}
