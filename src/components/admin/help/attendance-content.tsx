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

export function AttendanceHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Attendance</strong> page is where you launch the
          QR scanner for a class session. It shows today&rsquo;s
          sessions and the next two weeks&rsquo; worth so you can pick
          one and start scanning.
        </p>
      </Intro>

      <Section title="Open the scanner for today's class" anchor="open">
        <Steps>
          <Step n={1}>
            Look at the <em>Today</em> section at the top of the page.
          </Step>
          <Step n={2}>
            <strong>Click the session card</strong> for the class
            you&rsquo;re about to teach. The scanner opens on the next
            page.
          </Step>
        </Steps>
      </Section>

      <Section title="Scan a member's QR" anchor="scan">
        <p>
          Once the scanner is open, the camera on your device turns on
          and watches for QR codes.
        </p>
        <Steps>
          <Step n={1}>
            Hold the camera up to the member&rsquo;s phone (showing
            their QR email or saved photo).
          </Step>
          <Step n={2}>
            The camera reads the code. The member&rsquo;s name appears
            on screen with a green check &mdash; they&rsquo;re marked
            present.
          </Step>
          <Step n={3}>
            Move on to the next person. The same QR scanned twice
            won&rsquo;t double-count &mdash; it&rsquo;s safe to scan
            again if you&rsquo;re unsure.
          </Step>
        </Steps>
      </Section>

      <Section title="Mark someone present without their QR" anchor="manual">
        <p>
          If a member forgets their phone or has a new one without the
          QR yet:
        </p>
        <Steps>
          <Step n={1}>
            On the scanner screen, find the search box (above or below
            the camera view).
          </Step>
          <Step n={2}>
            Type their name. Pick them from the list that appears.
          </Step>
          <Step n={3}>
            They&rsquo;re marked present, just like a scan.
          </Step>
        </Steps>
        <Note>
          The scanner records who was marked manually so we can spot
          patterns over time.
        </Note>
      </Section>

      <Section title="Browse upcoming sessions" anchor="upcoming">
        <p>
          The <em>Upcoming</em> section below today shows the next 14
          days of sessions. Useful if you&rsquo;re prepping for a
          class later in the week.
        </p>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="The camera won't turn on. What do I do?">
          <p>
            Your browser is asking permission to use the camera the
            first time. Look for a small permission prompt near the
            top of the browser window and click <Pill>Allow</Pill>.
          </p>
          <p>
            On mobile Safari or Chrome, this needs HTTPS &mdash; which
            our site uses, so it should work. If it still doesn&rsquo;t,
            close the browser fully and try again.
          </p>
        </FaqItem>

        <FaqItem q="A QR scan says 'Invalid' or 'Not found'.">
          <p>The most likely causes:</p>
          <Bullets>
            <li>
              The member&rsquo;s QR was regenerated. Their old image
              stops working. Send them a fresh QR from their member
              profile.
            </li>
            <li>
              The QR is from a different school&rsquo;s system &mdash;
              ours only accepts our own.
            </li>
          </Bullets>
        </FaqItem>

        <FaqItem q="Can I see who showed up after class?">
          <p>
            Yes. Open the session from the Sessions page; there&rsquo;s
            a list of who scanned in.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
