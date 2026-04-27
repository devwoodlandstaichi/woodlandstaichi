import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { AboutSection } from "@/components/about-section";
import { ScheduleSection } from "@/components/schedule-section";
import { LocationsSection } from "@/components/locations-section";
import { ContactSection } from "@/components/contact-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-col">
        <Hero />
        <AboutSection />
        <ScheduleSection />
        <LocationsSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
