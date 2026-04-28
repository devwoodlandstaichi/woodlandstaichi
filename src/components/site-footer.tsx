import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/classes", label: "Classes" },
  { href: "/classes/register", label: "Register" },
  { href: "/world-tai-chi-day", label: "World Tai Chi Day" },
  { href: "/gallery", label: "Gallery" },
  { href: "/store", label: "Store" },
  { href: "/news", label: "News" },
  { href: "/links", label: "Links" },
];

export async function SiteFooter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = !!user;

  return (
    <footer className="mt-20 border-t border-foreground/10 bg-ink-950 text-ink-100">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-3xl tracking-tight">
              Woodlands <span className="italic text-vermillion-300">Tai Chi</span>
            </p>
            <p className="mt-4 max-w-md text-ink-300 leading-relaxed">
              Meditation in motion. A community school in The Woodlands, Texas
              — open to all, free for beginners.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs uppercase tracking-[0.25em] text-ink-300">
              Pages
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-ink-100 hover:text-vermillion-300 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs uppercase tracking-[0.25em] text-ink-300">
              Visit
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>The Woodlands Methodist Church</li>
              <li className="text-ink-300">1915 Lake Front Circle</li>
              <li className="pt-2">Kevin Brady Community Center</li>
              <li className="text-ink-300">2250 Buckthorne Pl</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs uppercase tracking-[0.25em] text-ink-300">
              Reach us
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="mailto:info@woodlandstaichi.com"
                  className="hover:text-vermillion-300 transition-colors"
                >
                  info@woodlandstaichi.com
                </a>
              </li>
              <li>
                <a href="sms:8323816078" className="hover:text-vermillion-300 transition-colors">
                  Text: (832) 381-6078
                </a>
                <span className="block text-xs text-ink-300 mt-1">
                  English only · phone not always answered
                </span>
              </li>
              <li className="pt-2">
                <Link
                  href="https://www.facebook.com/groups/1461755900795097/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-vermillion-300 transition-colors"
                >
                  Facebook group →
                </Link>
              </li>
              <li className="pt-2 border-t border-ink-800">
                <Link
                  href={signedIn ? "/members/me" : "/login?next=/members/me"}
                  className="hover:text-vermillion-300 transition-colors"
                >
                  {signedIn ? "My profile →" : "Member sign-in →"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-ink-800 pt-8 text-xs text-ink-300">
          <p>
            © {new Date().getFullYear()} Woodlands Tai Chi. Taught in the
            lineage of Master George Ling Hu.
          </p>
          <p className="italic">A non-profit community of practitioners.</p>
        </div>
      </div>
    </footer>
  );
}
