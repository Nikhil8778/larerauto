"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const WHATSAPP_NUMBER = "15482558778";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi LARE Automotive, I need a quote for an auto part. My VIN is: "
)}`;
const PHONE_LINK = `tel:+1-548-255-8778`;

const nav = [
  { label: "About Us", href: "/about" },
  { label: "Parts", href: "/catalog" },
  { label: "Instant Quote", href: "/quote" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact Us", href: "/contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center gap-3 px-3 sm:px-4 md:h-[88px] md:px-6">
        {/* Logo */}
        <Link href="/catalog" className="flex shrink-0 items-center overflow-hidden">
          <div className="relative h-[56px] w-[150px] overflow-hidden sm:h-[60px] sm:w-[180px] md:h-[68px] md:w-[220px] lg:h-[72px] lg:w-[250px]">
            <Image
              src="/brand/lare-automotive-logo.png"
              alt="LARE Automotive"
              fill
              priority
              className="object-contain scale-[2.15] sm:scale-[2.2] md:scale-[2.28] lg:scale-[2.35] origin-center"
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex flex-1 justify-center">
          <ul className="flex items-center gap-8 text-sm font-semibold text-white/85">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="whitespace-nowrap transition hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right buttons */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:h-10 sm:w-auto sm:px-5 sm:text-sm sm:font-bold"
          >
            <span className="hidden sm:inline">Call</span>
            <span className="sm:hidden">📞</span>
          </a>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile / Tablet drawer */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-white/10 bg-slate-950/95 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-white font-semibold">Menu</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white"
              >
                ✕
              </button>
            </div>

            <ul className="mt-6 space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 transition hover:bg-white/10"
                  >
                    {item.label}
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