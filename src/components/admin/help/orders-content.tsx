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

export function OrdersHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Orders</strong> page tracks merchandise orders
          (shirts, jackets, fans, uniforms) that members place through
          the public store. Mark them paid as money lands.
        </p>
      </Intro>

      <Section title="The four tabs" anchor="tabs">
        <Bullets>
          <li>
            <strong>Unpaid</strong> &mdash; new orders. <em>Default
            view.</em>
          </li>
          <li>
            <strong>Paid</strong> &mdash; orders whose payment has
            arrived.
          </li>
          <li>
            <strong>Cancelled</strong> &mdash; orders that didn&rsquo;t
            go through.
          </li>
          <li>
            <strong>All</strong> &mdash; everything together.
          </li>
        </Bullets>
      </Section>

      <Section title="Mark an order paid" anchor="paid">
        <Steps>
          <Step n={1}>Find the row in the Unpaid tab.</Step>
          <Step n={2}>
            Click <Pill primary>Mark paid</Pill>.
          </Step>
        </Steps>
        <Note>
          Marking a store order paid does not change anything on the
          membership side. Orders are independent of class
          registrations.
        </Note>
      </Section>

      <Section title="See the items in an order" anchor="view">
        <p>
          Click anywhere on the order row (or click the customer&rsquo;s
          name) to open the order detail page. You&rsquo;ll see:
        </p>
        <Bullets>
          <li>Each item with its size and quantity</li>
          <li>The total amount</li>
          <li>Customer notes (special requests, etc.)</li>
          <li>Payment status and date received</li>
        </Bullets>
      </Section>

      <Section title="Reset an order to unpaid" anchor="reset">
        <p>
          If you marked something paid by mistake, find it in the Paid
          tab and click <Pill>Reset to unpaid</Pill>. It moves back to
          the Unpaid queue.
        </p>
      </Section>

      <Section title="Cancel an order" anchor="cancel">
        <p>
          If an order falls through (the member changed their mind, a
          duplicate, etc.), open the order and click{" "}
          <Pill>Cancel order</Pill>. It moves to the{" "}
          <strong>Cancelled</strong> tab &mdash; kept for the record
          rather than erased.
        </p>
      </Section>

      <Section title="Add internal notes" anchor="notes">
        <p>
          On the order detail page there&rsquo;s an{" "}
          <strong>Internal notes</strong> box &mdash; jot anything
          staff-facing (e.g. &ldquo;picked up at Saturday class&rdquo;),
          then click <Pill primary>Save notes</Pill>. These are separate
          from the customer&rsquo;s own notes on the order and are never
          shown publicly.
        </p>
      </Section>

      <Section title="Delete an order" anchor="delete">
        <p>
          On the order detail page, <Pill destructive>Delete</Pill>{" "}
          permanently removes an order. Use this only for genuine junk
          rows &mdash; for real orders that didn&rsquo;t go through,
          prefer <em>Cancel order</em> so the history stays intact.
        </p>
      </Section>

      <Section title="Find an order" anchor="find">
        <p>
          Use the <strong>Search</strong> box above the list to match by
          customer name or email, or the <strong>Status</strong> filter
          to jump between Unpaid / Paid / Cancelled / All.
        </p>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Where does a new order come from?">
          <p>
            Members fill out the order form at{" "}
            <code className="rounded bg-foreground/10 px-1 py-0.5">
              woodlandstaichi.com/store/order
            </code>
            . That form creates the order row you see here.
          </p>
        </FaqItem>

        <FaqItem q="Does the customer get a confirmation?">
          <p>
            They get a confirmation email when they submit the order.
            Marking paid here doesn&rsquo;t send a follow-up email
            automatically &mdash; reach out to them yourself if needed.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
