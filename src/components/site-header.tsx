"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { FontScaler } from "@/components/font-scaler";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

const NAV: NavItem[] = [
  {
    href: "/about",
    label: "About",
    children: [
      { href: "/about", label: "Our community" },
      { href: "/about/why", label: "Why Tai Chi" },
      { href: "/about/instructors", label: "Instructors" },
      { href: "/gallery", label: "Gallery" },
      { href: "/world-tai-chi-day", label: "World Tai Chi Day" },
    ],
  },
  { href: "/classes", label: "Classes" },
  { href: "/store", label: "Store" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-md border-b border-foreground/8" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        {/* Logo lockup */}
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Woodlands Tai Chi — home"
        >
          <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full ring-1 ring-foreground/10 transition-transform group-hover:scale-105">
            <Image
              src="/logo.jpg"
              alt=""
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </span>
          <span className="hidden sm:flex flex-col leading-[1.05] font-display text-base font-medium tracking-tight">
            <span>Woodlands</span>
            <span className="italic text-vermillion">Tai Chi</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8"
        >
          {NAV.map((item) =>
            item.children ? (
              <div key={item.href} className="group relative">
                <a
                  href={item.href}
                  className="inline-flex items-center gap-1 text-sm tracking-wide text-foreground/75 hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-vermillion after:transition-all hover:after:w-full"
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className="opacity-50 transition-transform group-hover:rotate-180"
                  />
                </a>
                <div
                  className={cn(
                    "invisible opacity-0 absolute left-1/2 top-full -translate-x-1/2 pt-3",
                    "group-hover:visible group-hover:opacity-100",
                    "focus-within:visible focus-within:opacity-100",
                    "transition-opacity duration-150",
                  )}
                >
                  <div className="min-w-[14rem] rounded-lg border border-foreground/10 bg-background/95 backdrop-blur-md shadow-xl py-2">
                    {item.children.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-sm tracking-wide text-foreground/75 hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-vermillion after:transition-all hover:after:w-full"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <FontScaler />
          <Link
            href="/classes/register"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-vermillion px-5 py-2.5 text-sm font-medium text-background hover:bg-vermillion-600 transition-colors"
          >
            Register
            <span aria-hidden>→</span>
          </Link>
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 hover:bg-foreground/5"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 bg-background/95 backdrop-blur-md border-b border-foreground/8",
          open ? "max-h-[36rem] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col px-6 py-3">
          {NAV.map((item) => (
            <div key={item.href} className="border-b border-foreground/5">
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 block text-base text-foreground/85 hover:text-foreground"
              >
                {item.label}
              </a>
              {item.children && (
                <ul className="pb-2 -mt-1">
                  {item.children.slice(1).map((child) => (
                    <li key={child.href}>
                      <a
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="block pl-4 py-2 text-sm text-foreground/65 hover:text-foreground"
                      >
                        ↳ {child.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <Link
            href="/classes/register"
            onClick={() => setOpen(false)}
            className="mt-3 mb-2 inline-flex items-center justify-center gap-2 rounded-full bg-vermillion px-5 py-3 text-base font-medium text-background"
          >
            Register
            <span aria-hidden>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
