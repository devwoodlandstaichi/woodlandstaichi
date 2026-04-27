import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { RegistrationForm } from "./registration-form";

export const metadata: Metadata = {
  title: "Register for a beginner cohort",
  description:
    "Register for the next Woodlands Tai Chi beginner cohort. Free of charge — only the WTC shirt fee is required.",
};

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Beginner registration"
          title="Begin"
          italic="here."
          intro="Tell us about you, pick a cohort, sign the waiver. We'll email you within a few days with the shirt-payment instructions and the first class details."
          glyph="始"
        />

        <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <RegistrationForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
