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
          QR scanner for a class. You can scan one specific class at a
          time, or start a <strong>kiosk</strong> that auto-rotates
          through every class at one location for the whole day.
        </p>
      </Intro>

      <Section title="Two ways to scan" anchor="modes">
        <Bullets>
          <li>
            <strong>One class at a time</strong> — click a session card.
            The scanner opens for just that class. Best when you&rsquo;re
            running the scanner on your own laptop and only need to
            cover the class you&rsquo;re teaching.
          </li>
          <li>
            <strong>Auto-rotating kiosk</strong> — the{" "}
            <Pill primary>Start today&rsquo;s session</Pill> button at
            the top of the Today list. Locks a tablet into kiosk mode
            and walks through every class at that location for the rest
            of the day on its own. See &ldquo;Run a kiosk for the
            day&rdquo; below.
          </li>
        </Bullets>
      </Section>

      <Section title="Open the scanner for one class" anchor="open">
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

      <Section title="Run a kiosk for the day" anchor="kiosk">
        <p>
          The kiosk is for a shared device — typically a tablet you set
          up at the front of the room before class. Once started, it
          handles every class at that location for the rest of the day
          without anyone touching it.
        </p>
        <Steps>
          <Step n={1}>
            On the tablet, sign in and open <em>/admin/attendance</em>.
          </Step>
          <Step n={2}>
            In the <em>Today</em> section, click{" "}
            <Pill primary>Start today&rsquo;s session</Pill>.
          </Step>
          <Step n={3}>
            A confirm box walks through what will happen. Click{" "}
            <Pill primary>Start kiosk</Pill>.
          </Step>
        </Steps>
        <Note>
          <strong>What &ldquo;auto-rotate&rdquo; means in plain
          terms:</strong>
          <Bullets>
            <li>
              Check-in opens <strong>20 minutes before</strong> a class
              starts so early arrivals can scan as they walk in.
            </li>
            <li>
              Check-in stays open <strong>15 minutes after</strong> the
              class starts to catch latecomers, then closes.
            </li>
            <li>
              Between classes, the kiosk shows a &ldquo;Class is closed
              for check-in&rdquo; screen with a live countdown to the
              next class.
            </li>
            <li>
              When the next class&rsquo;s pre-open window arrives, the
              kiosk flips back to the scanner on its own — nobody
              touches the tablet.
            </li>
            <li>
              At the end of the day, the kiosk shows &ldquo;All
              check-ins for today are complete&rdquo; and stays there
              until tomorrow.
            </li>
          </Bullets>
        </Note>
      </Section>

      <Section title="Exit the kiosk" anchor="exit">
        <p>
          A locked kiosk needs the <strong>kiosk PIN</strong> to exit
          (set under <em>Settings &rarr; Kiosk PIN</em>). This stops
          curious students from closing the scanner and exploring the
          admin pages.
        </p>
        <Steps>
          <Step n={1}>
            Tap the <Pill>Exit kiosk</Pill> button in the top-right.
          </Step>
          <Step n={2}>Type the kiosk PIN.</Step>
          <Step n={3}>Confirm.</Step>
        </Steps>
        <Note>
          Forgot the PIN? Open <em>Settings &rarr; Kiosk PIN</em> from
          a separate device (admin-only), clear it, and set a new one.
        </Note>
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
          days of sessions. Useful if you&rsquo;re prepping for a class
          later in the week.
        </p>
        <Note>
          The <em>Today</em> and <em>Past</em> tabs are{" "}
          <strong>time-sensitive</strong>: a class that ended 30
          minutes ago today automatically moves to the <em>Past</em>{" "}
          tab. So if you don&rsquo;t see today&rsquo;s 8 a.m. class on
          the Today list at 10 a.m., it&rsquo;s on Past — that&rsquo;s
          intentional.
        </Note>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What's the difference between a session card click and the Start kiosk button?">
          <p>
            Clicking a session card opens the scanner for{" "}
            <em>that one class only</em>, inside the admin shell — you
            can still navigate elsewhere. The <em>Start kiosk</em>{" "}
            button locks the device into kiosk mode and auto-rotates
            through every class at that location for the whole day.
            Exit needs the kiosk PIN.
          </p>
        </FaqItem>

        <FaqItem q="What if my school has multiple locations on the same day?">
          <p>
            The Today section shows one <em>Start kiosk</em> button per
            distinct location. Tap the one matching the tablet&rsquo;s
            physical spot. The kiosk only auto-rotates among classes at
            that location.
          </p>
        </FaqItem>

        <FaqItem q="Can someone arriving 25 minutes early still check in?">
          <p>
            No — the early window is exactly <strong>20 minutes</strong>.
            Before that, the kiosk shows the closed/countdown screen. If
            you absolutely need to check someone in earlier, click the
            session card from the admin view (skipping the kiosk-mode
            timing rules).
          </p>
        </FaqItem>

        <FaqItem q="What about back-to-back classes?">
          <p>
            If class A runs 8:30–9:30 and class B runs 9:30–10:30:
            class A&rsquo;s check-in closes at 9:45 (15 minutes after
            start), and class B&rsquo;s check-in opened at 9:10 (20
            minutes before start). The kiosk hands off automatically at
            9:10 — you may see brief overlap where both windows are
            open. That&rsquo;s fine; the scanner picks the closer class
            for each scan.
          </p>
        </FaqItem>

        <FaqItem q="The camera won't turn on. What do I do?">
          <p>
            Your browser is asking permission to use the camera the
            first time. Look for a small permission prompt near the top
            of the browser window and click <Pill>Allow</Pill>.
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
