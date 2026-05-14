import {
  FaqItem,
  Intro,
  Note,
  Pill,
  Section,
  Step,
  Steps,
  Warning,
} from "./primitives";

export function MembersHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Members</strong> page is the school&rsquo;s
          roster. Every person who has registered for a class shows up
          here. Use it to find someone, change their level or status,
          and send them their attendance QR badge.
        </p>
      </Intro>

      <Section title="Find a member" anchor="find">
        <p>The list can get long. To find one person:</p>
        <Steps>
          <Step n={1}>
            Use the <strong>Search</strong> box at the top. Type any
            part of their name, nickname, email, or phone. The list
            updates as you type.
          </Step>
          <Step n={2}>
            Or use the <strong>Status</strong> filter to show only{" "}
            <em>Active</em>, <em>Waitlist</em>, or <em>Inactive</em>{" "}
            members.
          </Step>
          <Step n={3}>
            Or use the <strong>Level</strong> filter (Beginners,
            Intermediate, Advanced, etc.).
          </Step>
        </Steps>
      </Section>

      <Section title="Edit one member" anchor="edit">
        <Steps>
          <Step n={1}>
            <strong>Click their name</strong> in the list to open their
            profile.
          </Step>
          <Step n={2}>
            Click <Pill>Edit</Pill> to change their information &mdash;
            name, email, phone, address, emergency contact, level, or
            status.
          </Step>
          <Step n={3}>
            Click <Pill primary>Save</Pill> at the bottom.
          </Step>
        </Steps>
        <Note>
          Changes show up in the system right away. There&rsquo;s no
          second &ldquo;publish&rdquo; step.
        </Note>
      </Section>

      <Section title="Change status or level for many at once" anchor="bulk">
        <p>
          Useful when a graduating class moves from Beginners to
          Intermediate, or when you need to mark a whole group inactive
          for the season.
        </p>
        <Steps>
          <Step n={1}>
            Click the small box at the start of each row to{" "}
            <strong>select</strong> those members. Or click the
            top-row checkbox to select everyone visible.
          </Step>
          <Step n={2}>
            <strong>Right-click</strong> any selected row (or use the
            menu button) to open the action menu.
          </Step>
          <Step n={3}>
            Pick a new <em>Status</em> (Active / Waitlist / Inactive)
            or a new <em>Level</em> (Beginners, Intermediate, etc.).
          </Step>
        </Steps>
      </Section>

      <Section title="Send a member their QR badge" anchor="qr-one">
        <p>
          Members use a QR code to check in to class. Each member has
          their own unique code. To send it:
        </p>
        <Steps>
          <Step n={1}>Open the member&rsquo;s profile.</Step>
          <Step n={2}>
            Click the <Pill>Send QR</Pill> button at the top of the
            page (it reads <Pill>Issue &amp; send QR</Pill> when the
            member doesn&rsquo;t have a code yet — clicking still
            works, we&rsquo;ll create one for them).
          </Step>
          <Step n={3}>Confirm. The button flashes &ldquo;Sent&rdquo; on success.</Step>
        </Steps>
        <p>
          You can also do this straight from the members list: each row
          has a small QR icon next to the name; click it for the same
          confirm-then-send flow without opening the profile. A green
          check mark appears on the row once we&rsquo;ve emailed their
          QR — so you can see at a glance who still needs theirs.
        </p>
      </Section>

      <Section title="The Actions menu" anchor="actions-menu">
        <p>
          Most page-level bulk operations live behind one dropdown in
          the top-right: the <Pill>Actions</Pill> button. Open it to
          see everything that operates on more than one member at
          once.
        </p>
        <p>What&rsquo;s inside:</p>
        <Steps>
          <Step n={1}>
            <strong>Export CSV</strong> &mdash; download a spreadsheet
            of the currently-filtered members. See &ldquo;Export to
            spreadsheet&rdquo; below.
          </Step>
          <Step n={2}>
            <strong>Bulk issue QRs</strong> &mdash; create QR codes
            for every active or waitlist member who doesn&rsquo;t
            already have one. Doesn&rsquo;t send any email.
          </Step>
          <Step n={3}>
            <strong>Email N QRs</strong> &mdash; only appears when
            there&rsquo;s a queue of people whose QRs haven&rsquo;t
            been emailed yet. The number tells you how many are
            waiting.
          </Step>
          <Step n={4}>
            <strong>Clear all members</strong> (admin only, red) &mdash;
            wipes the roster. Treat with respect.
          </Step>
        </Steps>
      </Section>

      <Section title="Send QR badges to many members" anchor="qr-many">
        <p>Two ways to do this in batches.</p>
        <p>
          <strong>Option A &mdash; everyone who hasn&rsquo;t got one
          yet:</strong>
        </p>
        <Steps>
          <Step n={1}>
            Open <Pill>Actions</Pill> at the top-right of the members
            page.
          </Step>
          <Step n={2}>
            Click <Pill>Email N QRs</Pill> (the number tells you how
            many are queued). The item only appears when at least one
            QR is waiting to be emailed.
          </Step>
          <Step n={3}>Confirm.</Step>
          <Step n={4}>
            We send up to 50 emails per click. If more are queued,
            click again to send the next batch.
          </Step>
        </Steps>
        <p>
          <strong>Option B &mdash; only the people you select:</strong>
        </p>
        <Steps>
          <Step n={1}>Select the members in the list.</Step>
          <Step n={2}>
            Right-click and choose <strong>Email QR to N members</strong>.
          </Step>
          <Step n={3}>Confirm. Same 50-per-click limit applies.</Step>
        </Steps>
        <Note>
          Members without an email on file are skipped automatically. We
          tell you the count.
        </Note>
      </Section>

      <Section title="Issue missing QRs (without emailing)" anchor="qr-issue">
        <p>
          Sometimes you want to make QR codes for everyone but not yet
          email them. Open <Pill>Actions</Pill> at the top-right and
          click <Pill>Bulk issue QRs</Pill>. Every active or waitlist
          member who doesn&rsquo;t have a QR gets one made. Members
          who already have one are not affected.
        </p>
      </Section>

      <Section title="Export to spreadsheet" anchor="export-csv">
        <p>
          You can download the members list as a CSV (opens in Excel,
          Numbers, Google Sheets &mdash; any spreadsheet app).
        </p>
        <Steps>
          <Step n={1}>
            Open <Pill>Actions</Pill> at the top-right.
          </Step>
          <Step n={2}>
            Click <Pill>Export CSV</Pill>.
          </Step>
          <Step n={3}>
            A dialog opens with checkboxes for every column we can
            include. The most useful ones are checked for you (name,
            email, phone, level, status, join date). Tick or untick
            others to suit what you&rsquo;re building.
          </Step>
          <Step n={4}>
            The shortcuts above the groups (Select all / Clear / Reset
            defaults) help when you want everything or nothing.
          </Step>
          <Step n={5}>
            Click <Pill>Download CSV</Pill>. The file lands in your
            Downloads folder named{" "}
            <span className="font-mono">members-YYYY-MM-DD.csv</span>.
          </Step>
        </Steps>
        <Note>
          The export honours your current filters and sort. If
          you&rsquo;ve filtered to <strong>Active beginners</strong>
          on the page, that&rsquo;s exactly who lands in the file.
          Need everyone? Clear the filters first, then export.
        </Note>
      </Section>

      <Section title="Delete a member" anchor="delete">
        <Steps>
          <Step n={1}>Open their profile.</Step>
          <Step n={2}>
            Scroll to the bottom and click the red{" "}
            <Pill destructive>Delete</Pill> button.
          </Step>
          <Step n={3}>Confirm in the box that pops up.</Step>
        </Steps>
        <Warning>
          Deleting is permanent. Their attendance and registration
          history are deleted with them. If you&rsquo;re unsure, mark
          them <em>Inactive</em> instead.
        </Warning>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What's the difference between Active and Waitlist?">
          <p>
            <strong>Active</strong> means they&rsquo;ve completed
            registration and paid (or been waived). They show up on
            class rosters.
          </p>
          <p>
            <strong>Waitlist</strong> means they registered but
            haven&rsquo;t paid yet (or we haven&rsquo;t recorded
            payment). They auto-flip to Active when payment is marked
            on the Registrations page.
          </p>
        </FaqItem>

        <FaqItem q="Can I add a member directly without registration?">
          <p>
            Yes. Click <Pill>Add member</Pill> and fill in their info.
            Useful for transferring legacy roster data, family members
            you know, or special cases.
          </p>
        </FaqItem>

        <FaqItem q="What happens if I change a member's email?">
          <p>
            Their next attendance email and any new QR will go to the
            new address. Already-sent emails stay where they were sent.
          </p>
        </FaqItem>

        <FaqItem q="Why doesn't a member's QR work?">
          <p>
            If their QR was revoked (for security or because they lost
            their phone), the scanner refuses it. Open their profile
            and click <Pill>Regenerate QR</Pill> to issue a fresh one,
            then email it again.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
