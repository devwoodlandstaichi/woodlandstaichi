import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { signOut } from "@/app/login/actions";
import { MemberHero } from "./member-hero";
import { MemberTabs } from "./tab-nav";
import { PracticeNotes } from "./practice-notes";
import { type ProfileDefaults } from "./profile-form";
import { SetPasswordForm } from "./set-password-form";
import { TestimonialDialog } from "./testimonial-dialog";
import { PhotoAvatarDialog } from "./photo-avatar-dialog";
import {
  linkSelfByEmail,
  setOwnMemberPhoto,
  setOwnPhotoPublic,
} from "./actions";

type OwnTestimonial = {
  id: string;
  quote: string;
  attribution: string | null;
  status: "pending" | "approved" | "rejected";
  submitted_at: string | null;
  reviewer_note: string | null;
};

const TESTIMONIAL_STATUS_COPY: Record<
  OwnTestimonial["status"],
  { label: string; tone: string; description: string }
> = {
  pending: {
    label: "Awaiting review",
    tone: "border-vermillion/30 bg-vermillion/5 text-vermillion",
    description: "The founder will review and publish once approved.",
  },
  approved: {
    label: "Published",
    tone: "border-jade/30 bg-jade/10 text-jade",
    description: "Live on the public About page.",
  },
  rejected: {
    label: "Not published",
    tone: "border-foreground/15 bg-secondary text-foreground/65",
    description: "Feel free to revise and submit again.",
  },
};

export const metadata: Metadata = {
  title: "My profile — Woodlands Tai Chi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Member = ProfileDefaults & {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  level: string;
  status: string;
  user_id: string | null;
  birthday: string | null;
  photo_url: string | null;
  photo_public: boolean | null;
  created_at: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_phone: string | null;
  physical_limitations: string | null;
  prior_experience: string | null;
  found_us_via: string | null;
  expectations: string | null;
};

async function loadMember(): Promise<{
  member: Member | null;
  email: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { member: null, email: null };

  // Try to read the member row scoped by RLS first.
  const { data } = await supabase
    .from("members")
    .select(
      "id,first_name,last_name,email,level,status,user_id,nickname,phone,street,city,state,postal_code,birthday,bio,photo_url,photo_public,created_at,emergency_contact_name,emergency_contact_relationship,emergency_phone,physical_limitations,prior_experience,found_us_via,expectations",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) return { member: data as unknown as Member, email: user.email ?? null };

  // No linked row yet — try linking by email, then re-read.
  const link = await linkSelfByEmail();
  if (!link.ok) return { member: null, email: user.email ?? null };

  const admin = createAdminClient();
  const { data: linked } = await admin
    .from("members")
    .select(
      "id,first_name,last_name,email,level,status,user_id,nickname,phone,street,city,state,postal_code,birthday,bio,photo_url,photo_public,created_at,emergency_contact_name,emergency_contact_relationship,emergency_phone,physical_limitations,prior_experience,found_us_via,expectations",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    member: (linked as unknown as Member) ?? null,
    email: user.email ?? null,
  };
}

async function userHasPasswordSet(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // We track a `password_set` boolean in user_metadata. GoTrue stamps a
  // placeholder bcrypt on email-OTP signups, so encrypted_password is
  // always populated and useless as a signal. Anything truthy here means
  // the user explicitly set their password via /members/me.
  return user?.user_metadata?.password_set === true;
}

export default async function MyProfilePage() {
  const { member, email } = await loadMember();

  if (!email) redirect("/login?next=/members/me");

  // Members who signed in via email OTP have no password they chose
  // yet. Block the rest of the page until they set one so they can sign
  // in normally next time without waiting on email.
  const hasPassword = await userHasPasswordSet();
  if (member && !hasPassword) {
    return (
      <>
        <PageHeader
          eyebrow="One more step"
          title="Set a"
          italic="password."
          intro="So you can sign in next time without waiting on a one-time email code. Choose something memorable but strong."
          glyph="鍵"
        />
        <section className="mx-auto max-w-md px-6 py-3 md:py-5">
          <div className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
            <SetPasswordForm />
          </div>
        </section>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <PageHeader
          eyebrow="My profile"
          title="Welcome,"
          italic="we don't see you yet."
          intro="We couldn't match your sign-in email to a member record. Email the school and we'll link your account so you can edit your profile."
          glyph="識"
        />
        <section className="mx-auto max-w-2xl px-6 py-3 md:py-5">
          <div className="rounded-2xl border border-vermillion/20 bg-vermillion/5 p-6 md:p-8 flex items-start gap-4">
            <ShieldAlert
              size={28}
              aria-hidden
              className="text-vermillion shrink-0 mt-1"
            />
            <div>
              <p className="text-base text-foreground/85 leading-relaxed">
                You&apos;re signed in as <strong>{email}</strong>, but that
                email isn&apos;t on our roster yet. If you&apos;ve registered
                for a class, double-check the email you used. Otherwise,
                please{" "}
                <a
                  href="mailto:info@woodlandstaichi.com"
                  className="underline decoration-vermillion underline-offset-4"
                >
                  email the school
                </a>{" "}
                so we can link you.
              </p>
              <form action={signOut} className="mt-5">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-accent/10"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </section>
      </>
    );
  }

  const showSessionsTab = member.status === "active";
  const tabs = showSessionsTab
    ? [
        { href: "/members/me", label: "Profile" },
        { href: "/members/me/sessions", label: "Sessions" },
      ]
    : [{ href: "/members/me", label: "Profile" }];

  return (
    <>
      <MemberTabs tabs={tabs} />
      <MemberHero
        first_name={member.first_name}
        last_name={member.last_name}
        email={member.email}
        nickname={member.nickname}
        phone={member.phone}
        street={member.street}
        city={member.city}
        state={member.state}
        postal_code={member.postal_code}
        birthday={member.birthday}
        level={member.level}
        status={member.status}
        bio={member.bio}
        photo_url={member.photo_url}
        created_at={member.created_at}
        emergency_contact_name={member.emergency_contact_name}
        emergency_contact_relationship={member.emergency_contact_relationship}
        emergency_phone={member.emergency_phone}
        portrait={
          <PhotoAvatarDialog
            action={setOwnMemberPhoto}
            visibilityAction={setOwnPhotoPublic}
            memberName={`${member.first_name} ${member.last_name}`}
            photoUrl={member.photo_url}
            photoPublic={member.photo_public ?? false}
            description="A square-ish portrait works best — we'll auto-crop and shrink it for you."
          />
        }
      />

      <PracticeNotes
        physical_limitations={member.physical_limitations}
        prior_experience={member.prior_experience}
        found_us_via={member.found_us_via}
        expectations={member.expectations}
      />

      <section
        id="share-story"
        aria-labelledby="share-story-title"
        className="relative mx-auto max-w-7xl px-6 md:px-10 pb-20 scroll-mt-24"
      >
        <TestimonialPanel memberId={member.id} />
      </section>
    </>
  );
}

async function TestimonialPanel({ memberId }: { memberId: string }) {
  // Use the admin client only because the policy chain on testimonials
  // routes member-self reads through user_id → member_id, and we already
  // know the member_id here. Same row set the RLS policy would yield.
  const admin = createAdminClient();
  const { data } = await admin
    .from("testimonials")
    .select("id,quote,attribution,status,submitted_at,reviewer_note")
    .eq("member_id", memberId)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const own = (data ?? []) as OwnTestimonial[];

  // One submission per member: hide the trigger if anything pending or
  // approved exists. A rejected submission shouldn't lock them out —
  // they can revise and resubmit.
  const hasLiveSubmission = own.some(
    (t) => t.status === "pending" || t.status === "approved",
  );

  const intro = hasLiveSubmission
    ? "Thanks for sharing — see your submission below. Each member can submit one story; reach out to the school if you'd like to revise it."
    : "Members’ words mean more to newcomers than anything we could write. If Tai Chi has changed something for you, write a few sentences. Submissions are reviewed before they go live.";

  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl tracking-tight mb-2">
        {hasLiveSubmission ? "Your story" : "Share your story"}
      </h2>
      <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
        {intro}
      </p>

      {!hasLiveSubmission && <TestimonialDialog />}

      {own.length > 0 && (
        <div
          className={`${hasLiveSubmission ? "" : "mt-10 border-t border-foreground/8 pt-6"}`}
        >
          <h3 className="text-xs uppercase tracking-[0.22em] text-foreground/55 mb-4">
            Your submissions
          </h3>
          <ul className="space-y-4">
            {own.map((t) => {
              const s = TESTIMONIAL_STATUS_COPY[t.status];
              return (
                <li
                  key={t.id}
                  className="rounded-xl border border-foreground/10 p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${s.tone}`}
                    >
                      {s.label}
                    </span>
                    <span className="text-xs text-foreground/55">
                      {s.description}
                    </span>
                  </div>
                  <blockquote className="text-sm text-foreground/85 leading-relaxed">
                    “{t.quote}”
                  </blockquote>
                  {t.attribution && (
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-foreground/50">
                      {t.attribution}
                    </p>
                  )}
                  {t.status === "rejected" && t.reviewer_note && (
                    <p className="mt-3 rounded-md border border-foreground/10 bg-secondary px-3 py-2 text-xs text-foreground/70">
                      <span className="font-medium text-foreground/85">
                        Note from the founder:{" "}
                      </span>
                      {t.reviewer_note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

