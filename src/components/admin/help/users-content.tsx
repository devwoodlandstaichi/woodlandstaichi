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

export function UsersHelpContent() {
  return (
    <>
      <Intro>
        <p>
          The <strong>Users</strong> page is where you manage who can
          sign in to the admin area. Only admins see this page.
        </p>
      </Intro>

      <Section title="Invite a new admin or instructor" anchor="invite">
        <Steps>
          <Step n={1}>
            Click <Pill primary>+ Invite user</Pill>.
          </Step>
          <Step n={2}>Type their email address.</Step>
          <Step n={3}>
            Pick a role:
            <Bullets>
              <li>
                <strong>Admin</strong> &mdash; full access to everything.
              </li>
              <li>
                <strong>Instructor</strong> &mdash; access to most
                pages but not user management or kiosk PIN settings.
              </li>
            </Bullets>
          </Step>
          <Step n={4}>Click Send invite.</Step>
        </Steps>
        <Note>
          The invite is automatic &mdash; an email goes out
          immediately. The recipient sets up their password the first
          time they sign in.
        </Note>
      </Section>

      <Section title="Change someone's role" anchor="role">
        <Steps>
          <Step n={1}>Find their card in the list.</Step>
          <Step n={2}>
            Use the role selector to flip them between Admin,
            Instructor, or No role.
          </Step>
        </Steps>
        <p>
          <em>No role</em> means they have an account but can&rsquo;t
          access admin pages. Useful for temporarily revoking access
          without deleting.
        </p>
      </Section>

      <Section title="Resend an invite" anchor="resend">
        <p>
          If someone hasn&rsquo;t signed in yet (their card shows
          &ldquo;Last sign-in: Never&rdquo;) and they&rsquo;ve lost the
          email:
        </p>
        <Steps>
          <Step n={1}>Click their card.</Step>
          <Step n={2}>
            Click <Pill>Resend invite</Pill>.
          </Step>
        </Steps>
      </Section>

      <Section title="Set or reset someone's password" anchor="password">
        <p>
          If a user is locked out and the email flow isn&rsquo;t working
          (spam issues, wrong address on file), you can set a password
          for them directly:
        </p>
        <Steps>
          <Step n={1}>
            On their row, click <Pill>Change password</Pill> (the key
            icon).
          </Step>
          <Step n={2}>
            Type a new password &mdash; the show/hide eye lets you check
            it &mdash; and confirm.
          </Step>
          <Step n={3}>
            Tell them the new password over the phone or in person; they
            can change it later from their own account.
          </Step>
        </Steps>
        <Note>
          Prefer the <em>Forgot password</em> flow when it works &mdash;
          it lets the person choose their own password without you ever
          seeing it. Setting one here is the fallback for when they
          can&rsquo;t receive email.
        </Note>
      </Section>

      <Section title="Find a user" anchor="find">
        <p>The bar above the list narrows and orders it:</p>
        <Bullets>
          <li>
            <strong>Search</strong> &mdash; type part of an email
            address.
          </li>
          <li>
            <strong>Role</strong> &mdash; show only Admins, Instructors,
            or those with no role.
          </li>
          <li>
            <strong>Sort</strong> &mdash; reorder the list, and use the
            arrow beside it to flip ascending/descending.
          </li>
        </Bullets>
      </Section>

      <Section title="Delete a user" anchor="delete">
        <Steps>
          <Step n={1}>Open the user&rsquo;s card.</Step>
          <Step n={2}>
            Click <Pill destructive>Delete account</Pill>.
          </Step>
        </Steps>
        <Warning>
          You can&rsquo;t delete your own account. The card showing{" "}
          &ldquo;(you)&rdquo; has the delete button hidden so you
          don&rsquo;t lock yourself out.
        </Warning>
      </Section>

      <Section title="Common questions" anchor="faq">
        <FaqItem q="What's the difference between Users and Members?">
          <p>
            <strong>Members</strong> are the school&rsquo;s students
            &mdash; the roster of people taking class. They
            don&rsquo;t need accounts to attend.
          </p>
          <p>
            <strong>Users</strong> are people with sign-in access to
            this admin area &mdash; you, other instructors, the founder.
          </p>
          <p>
            One person can be both. Each member can also have a member
            account at /members/me to see their own info.
          </p>
        </FaqItem>

        <FaqItem q="Why doesn't someone get my invite email?">
          <p>
            Most often it&rsquo;s in their spam folder. Have them check.
            If still missing, click Resend invite. If still nothing,
            email them the sign-in URL directly so they can use the{" "}
            <em>Forgot password</em> flow on the login page.
          </p>
        </FaqItem>
      </Section>
    </>
  );
}
