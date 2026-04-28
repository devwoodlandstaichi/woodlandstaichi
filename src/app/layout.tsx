import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Woodlands Tai Chi — Meditation in motion",
    template: "%s · Woodlands Tai Chi",
  },
  description:
    "A community Tai Chi school in The Woodlands, Texas. Free beginner classes — taught in the lineage of Master George Ling Hu.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "Woodlands Tai Chi",
    description: "Meditation in motion. Free beginner Tai Chi classes in The Woodlands, Texas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the saved font-scale before paint so each navigation
            doesn't briefly show the SSR default size. Runs synchronously
            in <head>; the <html> element already exists. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=localStorage.getItem('wtc:font-scale');var n=v?Number(v):NaN;if([14,16,18].indexOf(n)>-1){document.documentElement.style.setProperty('--font-scale',String(n));}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
