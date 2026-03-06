"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const WHATSAPP_NUMBER = "15482558778";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi LARE Automotive, I need a quote for an auto part. My VIN is: "
)}`;
const PHONE_LINK = `tel:+1-548-255-8778`;

const navLinks = [
  { label: "About Us", href: "/about" },
  { label: "Parts", href: "/catalog" },
  { label: "Instant Quote", href: "/quote" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact Us", href: "/contact" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-6xl items-center gap-3 px-3 sm:px-4 md:h-[88px] md:px-6">
        {/* LEFT: Logo */}
        <Link href="/catalog" className="flex shrink-0 items-center overflow-hidden">
         <div className="relative h-[56px] w-[210px] sm:h-[62px] sm:w-[235px] md:h-[70px] md:w-[265px]">
        <Image
          src="/brand/lare-automotive-logo.png"
          alt="LARE AUTOMOTIVE"
          fill
          priority
          className="object-contain scale-[2.55] origin-center"
         />
        </div>
        </Link>

        {/* CENTER: Desktop Nav */}
        <nav className="hidden flex-1 lg:flex">
          <ul className="mx-auto flex items-center gap-8 text-sm font-semibold text-white/85">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="whitespace-nowrap transition hover:text-white"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* RIGHT: Actions */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-500/25 px-4 text-sm font-bold text-white transition hover:bg-emerald-500/35 sm:px-5"
          >
            WhatsApp
          </a>

          <a
            href={PHONE_LINK}
            className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20 sm:px-5"
          >
            <span className="hidden sm:inline">Call</span>
            <span className="sm:hidden">📞</span>
          </a>

          {/* Hamburger for mobile + tablet */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE / TABLET DRAWER */}
      {menuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-white/10 bg-slate-950/95 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <ul className="mt-6 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 transition hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-3">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500/25 text-white font-semibold transition hover:bg-emerald-500/35"
              >
                WhatsApp Support
              </a>

              <a
                href={PHONE_LINK}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 text-white font-semibold transition hover:bg-white/20"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
