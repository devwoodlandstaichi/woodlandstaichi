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

export function TestimonialsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Testimonials</strong> page is where you review
          and publish member quotes that appear on the public{" "}
          <em>About</em> page. Members can submit their own; you can
          also write them in directly.
        </p>
      </Intro>

      <Section title="Approve a submission" anchor="approve">
        <Steps>
          <Step n={1}>
            Open the <em>Pending</em> tab. These are submissions
            waiting on you.
          </Step>
          <Step n={2}>Read the quote. Lightly edit if needed for clarity.</Step>
          <Step n={3}>
            Click <Pill primary>Approve</Pill>. The quote goes live on
            the public site.
          </Step>
        </Steps>
        <Note>
          You can edit the quote before approving &mdash; fix typos,
          shorten if it&rsquo;s long. Just be careful to preserve the
          member&rsquo;s voice.
        </Note>
      </Section>

      <Section title="Reject a submission" anchor="reject">
        <Steps>
          <Step n={1}>Open the submission.</Step>
          <Step n={2}>
            (Optional) Type a short note about why &mdash; this is for
            your records, not shown to the member.
          </Step>
          <Step n={3}>
            Click <Pill destructive>Reject</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Add a testimonial yourself" anchor="add">
        <p>
          Useful for porting over old testimonials, or for quotes
          you&rsquo;ve gathered in person.
        </p>
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ New testimonial</Pill>.
          </Step>
          <Step n={2}>
            Fill in:
            <Bullets>
              <li>
                <strong>Member name</strong> (or pick from the roster).
              </li>
              <li>
                <strong>Attribution</strong> (optional) &mdash; e.g.
                &ldquo;Beginner, 6 months&rdquo;.
              </li>
              <li>
                <strong>Quote</strong> &mdash; the testimonial text.
              </li>
              <li>
                <strong>Display order</strong> &mdash; lower numbers
                show first on the public site.
              </li>
            </Bullets>
          </Step>
          <Step n={3}>
            Decide if you want it active (visible). Most of the time
            yes.
          </Step>
          <Step n={4}>
            Click <Pill primary>Save</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Hide a published testimonial" anchor="hide">
        <p>
          Different from rejecting &mdash; the testimonial was approved,
          but you want to take it down temporarily.
        </p>
        <Steps>
          <Step n={1}>Find it in the list.</Step>
          <Step n={2}>
            Toggle <Pill>Hide</Pill>. The public no longer sees it.
          </Step>
        </Steps>
        <p>
          Toggle <Pill>Show</Pill> to bring it back.
        </p>
      </Section>

      <Section title="Reorder testimonials" anchor="order">
        <p>
          Each testimonial has a <em>Display order</em> number. Lower
          numbers appear first on the public site. Edit a testimonial
          and change the number to move it.
        </p>
      </Section>

      <Section title="Delete a testimonial" anchor="delete">
        <Steps>
          <Step n={1}>Open the testimonial.</Step>
          <Step n={2}>
            Click <Pill destructive>Delete</Pill> at the bottom.
          </Step>
        </Steps>
        <Warning>
          Deletion is permanent. If you&rsquo;re unsure, hide it
          instead.
        </Warning>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Why is a member's submission still showing as pending?">
          <p>
            Because nobody has approved it yet. Open the Pending tab
            and review the submissions you haven&rsquo;t acted on.
          </p>
        </FaqItem>

        <FaqItem q="A testimonial says 'Self-submitted'. What does that mean?">
          <p>
            The member typed it themselves on the website&rsquo;s About
            page. Self-submitted ones always go through Pending so you
            can review before publishing.
          </p>
        </FaqItem>

        <FaqItem q="Can I see how many are waiting for review?">
          <p>
            Yes &mdash; the count shows up on the Overview page (the
            home tile titled &ldquo;Testimonials awaiting
            review&rdquo;).
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
