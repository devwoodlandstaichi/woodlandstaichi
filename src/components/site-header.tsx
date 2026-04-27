"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { FontScaler } from "@/components/font-scaler";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/classes", label: "Classes" },
  { href: "/world-tai-chi-day", label: "WTCD" },
  { href: "/gallery", label: "Gallery" },
  { href: "/store", label: "Store" },
  { href: "/news", label: "News" },
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
              src="/logo.png"
              alt=""
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-lg font-medium tracking-tight">
              Woodlands
            </span>
            <span className="font-display text-lg font-medium tracking-tight italic text-vermillion">
              Tai Chi
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm tracking-wide text-foreground/75 hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-vermillion after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <FontScaler />
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
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col px-6 py-3">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="py-3 text-base text-foreground/85 hover:text-foreground border-b border-foreground/5 last:border-0"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
