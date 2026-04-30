import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mail, ShieldAlert, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { signOut } from "@/app/login/actions";
import { ProfileForm, type ProfileDefaults } from "./profile-form";
import { SetPasswordForm } from "./set-password-form";
import { TestimonialForm } from "./testimonial-form";
import { linkSelfByEmail } from "./actions";
import { levelLabel } from "@/lib/format";

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
      "id,first_name,last_name,email,level,status,user_id,nickname,phone,street,city,state,postal_code,bio,photo_url",
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
      "id,first_name,last_name,email,level,status,user_id,nickname,phone,street,city,state,postal_code,bio,photo_url",
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
  // placeholder bcrypt on magic-link signups, so encrypted_password is
  // always populated and useless as a signal. Anything truthy here means
  // the user explicitly set their password via /members/me.
  return user?.user_metadata?.password_set === true;
}

export default async function MyProfilePage() {
  const { member, email } = await loadMember();

  if (!email) redirect("/login?next=/members/me");

  // Members who signed in via magic-link OTP have no password they
  // chose yet. Block the rest of the page until they set one so they
  // can sign in normally next time without waiting on email.
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

  const fullName = `${member.first_name} ${member.last_name}`;

  return (
    <>
      <PageHeader
        eyebrow="My profile"
        title={member.first_name}
        italic="welcome back."
        intro="Keep your details current so instructors can reach you, and write a short bio you'd be proud to have on the public Instructors page if you ever take that step."
        glyph="己"
      />

      <section className="mx-auto max-w-3xl px-6 py-3 md:py-5 grid gap-8">
        <div className="grid gap-4 rounded-2xl border border-foreground/10 bg-card p-6 md:p-8 sm:grid-cols-3">
          <Identity
            label="Name"
            value={fullName}
            icon={<UserCircle size={18} aria-hidden />}
          />
          <Identity
            label="Email"
            value={member.email}
            icon={<Mail size={18} aria-hidden />}
          />
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
              Level
            </p>
            <p className="text-base">{levelLabel(member.level)}</p>
            <p className="mt-1 text-xs text-foreground/55 capitalize">
              {member.status}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl tracking-tight mb-2">
            Edit your details
          </h2>
          <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
            Name, email, and level are managed by an instructor. Everything
            else here is yours to update.
          </p>
          <ProfileForm
            defaults={{
              nickname: member.nickname,
              phone: member.phone,
              street: member.street,
              city: member.city,
              state: member.state,
              postal_code: member.postal_code,
              bio: member.bio,
            }}
          />
        </div>

        <TestimonialPanel memberId={member.id} />

        <div className="rounded-2xl border border-foreground/10 bg-secondary/40 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/55 mb-2">
            Account
          </p>
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm hover:bg-accent/10"
            >
              Sign out
            </button>
          </form>
        </div>
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

  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl tracking-tight mb-2">
        Share your story
      </h2>
      <p className="text-sm text-foreground/60 mb-6 leading-relaxed">
        Members&rsquo; words mean more to newcomers than anything we could
        write. If Tai Chi has changed something for you, write a few
        sentences. Submissions are reviewed before they go live.
      </p>

      <TestimonialForm />

      {own.length > 0 && (
        <div className="mt-10 border-t border-foreground/8 pt-6">
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

function Identity({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/55 mb-1">
        {label}
      </p>
      <p className="flex items-center gap-2 text-base">
        <span aria-hidden className="text-foreground/45">
          {icon}
        </span>
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}
