import {
  Bullets,
  Example,
  FaqItem,
  Intro,
  Note,
  Pill,
  Quote,
  Section,
  Step,
  Steps,
  Warning,
} from "./primitives";

export function RegistrationsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Registrations</strong> page is your daily payment
          queue. Whenever a new student registers for a class, their
          name shows up here as &ldquo;pending&rdquo;. Mark them paid
          when their payment lands &mdash; the system handles the rest.
        </p>
      </Intro>

      <Section title="The six views" anchor="tabs">
        <p>The dropdown at the top filters the list:</p>
        <Bullets>
          <li>
            <strong>Pending</strong> &mdash; new registrations awaiting
            payment. <em>This is the main view you&rsquo;ll work in</em>
            and it&rsquo;s the default when you open the page.
          </li>
          <li>
            <strong>All</strong> &mdash; every registration ever, no
            filter. Useful for audits or when you&rsquo;re looking for
            a specific person but aren&rsquo;t sure what state their
            row is in. Denied rows show up here too; you&rsquo;ll see
            the &ldquo;denied&rdquo; badge in the Payment column.
          </li>
          <li>
            <strong>Paid</strong> &mdash; registrations whose payment has
            arrived.
          </li>
          <li>
            <strong>Waived</strong> &mdash; registrations where you
            comped the shirt fee.
          </li>
          <li>
            <strong>Refunded</strong> &mdash; payments that were
            reversed.
          </li>
          <li>
            <strong>Denied</strong> &mdash; registrations you decided
            not to accept (audit trail kept).
          </li>
        </Bullets>
      </Section>

      <Section title="Mark someone paid" anchor="paid">
        <Steps>
          <Step n={1}>
            Find the registration in the <em>Pending</em> tab. Each row
            shows the member&rsquo;s name, the class, the shirt size,
            and how they said they&rsquo;d pay (Zelle, Venmo, etc.).
          </Step>
          <Step n={2}>
            When their payment arrives, click <Pill primary>Mark paid</Pill>
            on that row.
          </Step>
        </Steps>
        <Note>
          Marking paid does two things at once: it records the payment,
          AND it auto-activates the member on the roster. They go from
          waitlist to active and an &ldquo;You&rsquo;re confirmed&rdquo;
          email goes out automatically.
        </Note>
      </Section>

      <Section title="Waive the fee" anchor="waive">
        <p>
          If you&rsquo;re comping someone (financial hardship, family
          discount, instructor-in-training), use Waive instead of paid:
        </p>
        <Steps>
          <Step n={1}>Find the row in the Pending tab.</Step>
          <Step n={2}>
            Click the <Pill>Waive</Pill> button.
          </Step>
        </Steps>
        <p>
          Same end result as Mark paid &mdash; member auto-activates,
          confirmation email goes out &mdash; but the queue records the
          fee was waived rather than paid.
        </p>
      </Section>

      <Section title="Decline a registration" anchor="deny">
        <p>
          Sometimes a class is full, or a returning member needs a
          conversation first. Use Deny instead of just deleting the
          row, so we keep a record.
        </p>
        <Steps>
          <Step n={1}>Find the row in the Pending tab.</Step>
          <Step n={2}>
            (Optional, recommended) Type a short reason in the small
            <em> Reason </em> box on that row. The member sees this in
            the email.
          </Step>
          <Step n={3}>
            Click the <Pill destructive>Deny</Pill> button.
          </Step>
        </Steps>
        <Example>
          <p>
            A class is at capacity and Jane Smith just registered.
          </p>
          <Quote>
            <strong>Reason:</strong> The Wednesday 8:00 a.m. class is
            full this term. We&rsquo;ll save your spot for the October
            class &mdash; expect an email from us in September.
          </Quote>
          <p>
            Click Deny. Jane gets the email; she stays on the roster
            with status &ldquo;waitlist&rdquo;; she shows up on the
            Denied tab so you have an audit trail.
          </p>
        </Example>
        <p>
          Made a mistake? Open the Denied tab and click{" "}
          <Pill>Reverse denial</Pill> on that row.
        </p>
      </Section>

      <Section title="Other actions on a row" anchor="other">
        <Bullets>
          <li>
            <strong>Reset to pending</strong> &mdash; undoes a paid /
            waived / refunded mark, putting them back in the queue.
          </li>
          <li>
            <strong>Refund</strong> &mdash; only available on paid
            rows. Marks the registration refunded.
          </li>
          <li>
            <strong>Demote to waitlist</strong> &mdash; only shows up
            when the member is currently <em>active</em>. Use this if
            you marked someone paid by mistake or a payment bounces.
            No email is sent &mdash; this is an internal correction.
          </li>
        </Bullets>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Where does the confirmation email come from?">
          <p>
            Marking paid or waived in the <em>Pending</em> tab fires an
            automatic email from{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5">
              info@woodlandstaichi.com
            </code>{" "}
            congratulating the member and pointing them to the member
            portal. We also issue them an attendance QR if they
            don&rsquo;t already have one.
          </p>
          <p>
            Marking already-paid registrations as paid <em>again</em>{" "}
            does nothing &mdash; no duplicate email.
          </p>
        </FaqItem>

        <FaqItem q="Can I delete a registration entirely?">
          <p>
            Use Deny for legitimate rejections &mdash; it keeps the
            audit trail (when, by whom, what reason).
          </p>
          <p>
            For genuine garbage (test rows, spam, duplicates), each row
            in the list has a <Pill destructive>Delete</Pill> button, and
            the registration&rsquo;s detail page has one in the{" "}
            <em>Danger zone</em> at the bottom. Either removes the row
            entirely. Admin-only &mdash; instructors won&rsquo;t be able
            to complete the delete.
          </p>
        </FaqItem>

        <FaqItem q="What if the member registered for the wrong class?">
          <p>
            For now, the cleanest fix is: Deny the wrong registration
            with a friendly note, then ask them to register again for
            the right class.
          </p>
        </FaqItem>

        <FaqItem q="Will I get an email when someone registers?">
          <p>
            Yes. Each new registration sends a notice to{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5">
              info@woodlandstaichi.com
            </code>
            . You don&rsquo;t have to refresh this page to find new
            arrivals.
          </p>
        </FaqItem>
      </Section>

      <Section title="If something goes wrong" anchor="trouble">
        <Bullets>
          <li>
            <strong>Member didn&rsquo;t get the confirmation email.</strong>{" "}
            Check the Resend logs (or just resend by clicking Reset to
            pending and then Mark paid again). Watch their spam folder.
          </li>
          <li>
            <strong>Marked paid by accident.</strong> Click{" "}
            <em>Reset to pending</em>. Then if needed, the member can
            be moved back to waitlist with <em>Demote to waitlist</em>.
          </li>
        </Bullets>
        <Warning>
          The Demote button only undoes the <em>roster status</em>. To
          undo the email send, there&rsquo;s nothing to do &mdash; it&rsquo;s
          gone. Reach out to the member directly to clarify.
        </Warning>
      </Section>
    </>
  );
}
