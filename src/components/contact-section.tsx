import { Mail, MessageSquare } from "lucide-react";

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative mx-auto max-w-7xl px-6 pb-14 md:px-10 md:pb-20"
    >
      <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-gradient-to-br from-card to-secondary p-8 md:p-12">
        <span
          aria-hidden
          className="vertical-mark absolute right-8 top-8 hidden md:block text-7xl select-none"
        >
          歡
        </span>

        <div className="grid grid-cols-12 gap-x-6 gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
              <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
              Begin
            </p>
            <h2
              id="contact-title"
              className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight"
            >
              You&apos;re welcome
              <span className="block italic text-vermillion">to start.</span>
            </h2>
            <p className="mt-8 max-w-xl text-lg text-foreground/75 leading-relaxed">
              The next beginner cohorts open in <strong>June 2026</strong> and{" "}
              <strong>October 2026</strong>. Register online — or send a note
              and we&apos;ll save you a spot.
            </p>
            <a
              href="/classes/register"
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-vermillion px-7 py-4 text-base font-medium text-background hover:bg-vermillion-600 transition-colors"
            >
              Register for a beginner cohort
              <span aria-hidden>→</span>
            </a>
          </div>

          <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
            <a
              href="mailto:info@woodlandstaichi.com"
              className="group flex items-center gap-4 rounded-xl border border-foreground/10 bg-background/60 p-5 hover:border-vermillion/40 transition-colors"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-vermillion/10 text-vermillion">
                <Mail size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs uppercase tracking-[0.25em] text-foreground/55">
                  Email
                </span>
                <span className="block font-medium truncate">
                  info@woodlandstaichi.com
                </span>
              </span>
              <span aria-hidden className="text-foreground/40 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>

            <a
              href="sms:8323816078"
              className="group flex items-center gap-4 rounded-xl border border-foreground/10 bg-background/60 p-5 hover:border-vermillion/40 transition-colors"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                <MessageSquare size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs uppercase tracking-[0.25em] text-foreground/55">
                  Text · English only
                </span>
                <span className="block font-medium">(832) 381-6078</span>
              </span>
              <span aria-hidden className="text-foreground/40 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>

            <p className="text-xs text-foreground/55 px-1 leading-relaxed">
              A registration form is coming soon. For now, email or text is the
              fastest way to reach us.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
