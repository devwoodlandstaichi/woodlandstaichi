import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mail, ShieldAlert, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { signOut } from "@/app/login/actions";
import { ProfileForm, type ProfileDefaults } from "./profile-form";
import { linkSelfByEmail } from "./actions";
import { levelLabel } from "@/lib/format";

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

export default async function MyProfilePage() {
  const { member, email } = await loadMember();

  if (!email) redirect("/login?next=/members/me");

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
