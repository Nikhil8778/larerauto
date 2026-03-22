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

const mechanicMenu = [
  { label: "Mechanic Signup", href: "/mechanic-signup" },
  { label: "Mechanic Login", href: "/mechanic-login" },
  { label: "Mechanic Dashboard", href: "/mechanic-dashboard" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="relative z-[90] w-full border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center gap-3 px-3 sm:px-4 md:h-[88px] md:px-6">
          <Link href="/catalog" className="flex shrink-0 items-center overflow-hidden">
            <div className="relative h-[56px] w-[150px] overflow-hidden sm:h-[60px] sm:w-[180px] md:h-[68px] md:w-[220px] lg:h-[72px] lg:w-[250px]">
              <Image
                src="/brand/lare-automotive-logo.png"
                alt="LARE Automotive"
                fill
                priority
                className="origin-center object-contain scale-[2.15] sm:scale-[2.2] md:scale-[2.28] lg:scale-[2.35]"
              />
            </div>
          </Link>

          <nav className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-6 text-sm font-semibold text-white/85 xl:gap-8">
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

              <li className="group relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 whitespace-nowrap transition hover:text-white"
                >
                  <span>Mechanic</span>
                  <span className="text-xs">▾</span>
                </button>

                <div className="invisible absolute left-1/2 top-full z-[120] mt-3 w-56 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/95 p-2 opacity-0 shadow-2xl backdrop-blur-xl transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="space-y-1">
                    {mechanicMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/25 text-white transition hover:bg-emerald-500/35 sm:h-10 sm:w-auto sm:px-5 sm:text-sm sm:font-bold"
              aria-label="Open WhatsApp chat"
            >
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">
                <Image
                  src="/icons/whatsapp.svg"
                  alt="WhatsApp"
                  width={18}
                  height={18}
                />
              </span>
            </a>

            <a
              href={PHONE_LINK}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:h-10 sm:w-auto sm:px-5 sm:text-sm sm:font-bold"
              aria-label="Call now"
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
      </header>

      {open && (
        <div className="lg:hidden">
          <button
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] bg-black/20"
          />

          <aside className="fixed right-0 top-0 z-[210] w-[82%] max-w-[340px] rounded-bl-3xl border-b border-l border-white/10 bg-slate-900/45 text-white shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-end border-b border-white/10 px-4 py-4">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <nav>
                <ul className="space-y-3">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/95 transition hover:bg-white/15"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3 text-sm font-semibold text-white">Mechanic</div>
                <div className="space-y-2">
                  {mechanicMenu.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white/95 transition hover:bg-white/15"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 pt-1 pb-2">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500/30 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500/40"
                >
                  WhatsApp Support
                </a>

                <a
                  href={PHONE_LINK}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Call Now
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}