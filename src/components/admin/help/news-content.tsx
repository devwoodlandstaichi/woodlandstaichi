import Link from "next/link";
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

export function NewsHelpContent() {
  return (
    <>
      <Intro>
        <p>
          This page explains, step by step, how to add and manage stories
          on the <strong>News</strong> section of the school website. If
          you&rsquo;ve never used it before, start with{" "}
          <a href="#new" className="underline">
            Write a new story
          </a>
          .
        </p>
      </Intro>

      <Section title="What you can do here" anchor="overview">
        <p>
          The <strong>News</strong> page is where you write short stories
          for the school&rsquo;s public website &mdash; class updates,
          reminders, photos from a recent event. Members and visitors see
          these on the <em>News</em> page of the website.
        </p>
        <p>You can:</p>
        <Bullets>
          <li>Write a new story.</li>
          <li>Edit something you wrote earlier.</li>
          <li>Hide a story from the public (a &ldquo;draft&rdquo;).</li>
          <li>Show a story to the public (&ldquo;publish&rdquo;).</li>
          <li>Delete a story you don&rsquo;t need anymore.</li>
        </Bullets>
      </Section>

      <Section title="Write a new story" anchor="new">
        <Steps>
          <Step n={1}>
            On the <strong>News</strong> page, look at the top right.
            Click the button that says <Pill>+ New post</Pill>.
          </Step>
          <Step n={2}>
            Type a <strong>Title</strong> for your story. This is the
            headline visitors will see first.
          </Step>
          <Step n={3}>
            Choose a <strong>Posted date</strong>. This is the date that
            will show next to the headline. The current day is fine if
            you&rsquo;re writing about something that just happened.
          </Step>
          <Step n={4}>
            Type your story in the <strong>Body</strong> box. Write it
            like you would write an email &mdash; full sentences,
            paragraphs. Long stories are fine.
          </Step>
          <Step n={5}>
            <strong>Optional:</strong> add a <em>cover image</em>. Click
            the <Pill>Choose file</Pill> button under <em>Cover image</em>{" "}
            and pick a photo from your computer. A small preview will
            appear so you can check you picked the right one.
          </Step>
          <Step n={6}>
            When you&rsquo;re ready for visitors to see this story, leave
            the box next to <em>Published</em> checked. If you&rsquo;re
            not ready yet, uncheck it &mdash; it&rsquo;ll save as a draft
            only you can see.
          </Step>
          <Step n={7}>
            Click the <Pill primary>Save</Pill> button at the bottom.
          </Step>
        </Steps>

        <Example>
          <p>
            Sifu wants to remind members about the next World Tai Chi Day
            gathering.
          </p>
          <Quote>
            <strong>Title:</strong> World Tai Chi Day &mdash; Saturday at
            the park
            <br />
            <strong>Posted date:</strong> April 20, 2026
            <br />
            <strong>Body:</strong> Join us this Saturday at 9 a.m. at Town
            Green Park. Wear comfortable clothes. Bring water. Beginners
            welcome &mdash; no experience needed.
            <br />
            <strong>Cover image:</strong> a photo from last year&rsquo;s
            event
            <br />
            <strong>Published:</strong> ✓ checked
          </Quote>
          <p>
            After clicking Save, the story appears on the public website
            immediately.
          </p>
        </Example>
      </Section>

      <Section title="Edit a story you already wrote" anchor="edit">
        <Steps>
          <Step n={1}>
            On the <strong>News</strong> page, find the story you want to
            edit in the list.
          </Step>
          <Step n={2}>
            Click the <Pill>Edit</Pill> button on that row (it has a
            small pencil icon).
          </Step>
          <Step n={3}>
            Change whatever you need to change &mdash; title, date, body,
            cover image, published or not.
          </Step>
          <Step n={4}>
            Click <Pill primary>Save</Pill> at the bottom.
          </Step>
        </Steps>
        <Note>
          The change is live as soon as you click Save. There is no
          second &ldquo;publish&rdquo; step.
        </Note>
      </Section>

      <Section title="Hide a story from the public" anchor="unpublish">
        <p>
          If a story has a typo, or you posted it too early, you can hide
          it without deleting it.
        </p>
        <Steps>
          <Step n={1}>Find the story in the list.</Step>
          <Step n={2}>
            Click the <Pill>Unpublish</Pill> button on that row.
          </Step>
        </Steps>
        <p>
          The story is now a <em>draft</em>. The public can&rsquo;t see
          it. You can still see it in your list, with a grey
          &ldquo;Draft&rdquo; tag next to the title.
        </p>
        <p>
          When you&rsquo;re ready to show it again, click{" "}
          <Pill>Publish</Pill> on that same row.
        </p>
      </Section>

      <Section title="Replace or remove a cover image" anchor="cover">
        <Steps>
          <Step n={1}>Open the story (click Edit).</Step>
          <Step n={2}>
            You&rsquo;ll see the current cover image at the top.
          </Step>
          <Step n={3}>
            <strong>To replace:</strong> click <Pill>Choose file</Pill>{" "}
            and pick a new photo. The preview updates so you can confirm.
          </Step>
          <Step n={4}>
            <strong>To remove without replacing:</strong> click the{" "}
            <Pill>Remove cover image</Pill> button. The image will go
            away after you click Save.
          </Step>
          <Step n={5}>
            Click <Pill primary>Save</Pill> at the bottom.
          </Step>
        </Steps>
      </Section>

      <Section title="Delete a story" anchor="delete">
        <Steps>
          <Step n={1}>Find the story in the list.</Step>
          <Step n={2}>
            Click the small <Pill destructive>Delete</Pill> button on
            that row.
          </Step>
          <Step n={3}>
            A box will pop up asking you to confirm. Click{" "}
            <Pill destructive>Delete</Pill> in that box to remove the
            story for good.
          </Step>
        </Steps>
        <Warning>
          Deleting a story is permanent. There is no undo. If
          you&rsquo;re not sure, hide it (Unpublish) instead.
        </Warning>
      </Section>

      <Section title="Find a specific story" anchor="search">
        <p>
          When you have a lot of stories, the list at the top of the
          page can help.
        </p>
        <Bullets>
          <li>
            <strong>Search box:</strong> type any word from the title.
            The list updates as you type.
          </li>
          <li>
            <strong>Status filter:</strong> change &ldquo;All&rdquo;
            to &ldquo;Published&rdquo; to see only what&rsquo;s public.
            Choose &ldquo;Draft&rdquo; to see only your hidden stories.
          </li>
        </Bullets>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="Will members get an email when I post a new story?">
          <p>
            No, not automatically. Posting a story shows it on the
            website, but does not send any emails.
          </p>
        </FaqItem>

        <FaqItem q="What size should the cover image be?">
          <p>
            Anything from a phone or camera works. The website resizes
            photos automatically. If you can choose, photos that are
            wider than they are tall look best.
          </p>
        </FaqItem>

        <FaqItem q="Can I save a story to finish later?">
          <p>
            Yes. Uncheck the <em>Published</em> box before you click
            Save. The story will be saved as a draft. Only you (and
            other admins) can see drafts. Come back any time to finish
            writing it.
          </p>
        </FaqItem>

        <FaqItem q="I made a mistake. Can I undo?">
          <p>
            If you haven&rsquo;t clicked Save yet, just close the page
            without saving. Nothing is changed until you click Save.
          </p>
          <p>
            If you already saved, open the story again and edit it back
            to what you want. There is no &ldquo;undo&rdquo; button, but
            you can always edit again.
          </p>
        </FaqItem>

        <FaqItem q="Where does this story appear?">
          <p>
            Published stories show up at{" "}
            <code className="rounded bg-foreground/10 px-1.5 py-0.5">
              woodlandstaichi.com/news
            </code>
            . The newest one is at the top.
          </p>
        </FaqItem>
      </Section>

      <Section title="If something goes wrong" anchor="trouble">
        <Bullets>
          <li>
            <strong>The Save button is grey and won&rsquo;t click.</strong>{" "}
            You probably haven&rsquo;t typed a title yet. Scroll up and
            add one.
          </li>
          <li>
            <strong>I uploaded a photo but I don&rsquo;t see it.</strong>{" "}
            Make sure you also clicked Save afterward. The photo only
            attaches when you save.
          </li>
          <li>
            <strong>I see a red message at the top.</strong> Read what
            it says &mdash; it usually points at the field that needs
            fixing. After you fix that field, click Save again.
          </li>
          <li>
            <strong>Still stuck?</strong> Email{" "}
            <a
              href="mailto:info@woodlandstaichi.com"
              className="underline"
            >
              info@woodlandstaichi.com
            </a>{" "}
            and we&rsquo;ll help.
          </li>
        </Bullets>
      </Section>

      <div className="mt-12 border-t border-foreground/10 pt-6 text-base text-foreground/55">
        <p>
          Done with this page?{" "}
          <Link
            href="/admin/news"
            className="underline hover:text-foreground"
          >
            Go back to News
          </Link>
          .
        </p>
      </div>
    </>
  );
}
