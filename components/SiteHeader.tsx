"use client";

import Link from "next/link";
import Image from "next/image";

const WHATSAPP_NUMBER = "15482558778";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi LARE Automotive, I need a quote for an auto part. My VIN is: "
)}`;
const PHONE_LINK = `tel:+1-548-255-8778`;

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6">
          {/* Taller header like Screenshot-1 */}
          <div className="grid h-28 grid-cols-3 items-center">
            {/* LEFT: Logo */}
            <Link href="/" className="justify-self-start">
              {/* This forces the visible logo to be larger even if PNG has padding */}
              <div className="relative h-50 w-[180px] md:h-46 md:w-[260px]">
                <Image
                  src="/brand/lare-automotive-logo.png"
                  alt="LARE AUTOMOTIVE"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </Link>

            {/* CENTER: Nav */}
            <nav className="hidden md:flex justify-self-center">
              <ul className="flex items-center gap-14 text-sm font-semibold text-white/85">
                <li><Link className="hover:text-white transition" href="/catalog">Parts</Link></li>
                <li><Link className="hover:text-white transition" href="/about">About</Link></li>

                {/* keep on one line */}
                <li>
                  <Link className="hover:text-white transition whitespace-nowrap" href="/quote">
                    Instant Quote
                  </Link>
                </li>

                <li><Link className="hover:text-white transition" href="/reviews">Reviews</Link></li>
                <li><Link className="hover:text-white transition" href="/call">Call</Link></li>
              </ul>
            </nav>

            {/* RIGHT: Buttons */}
            <div className="flex items-center gap-3 justify-self-end">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-500/25 px-5 text-sm font-bold text-white hover:bg-emerald-500/35 transition"
              >
                WhatsApp
              </a>
              <a
                href={PHONE_LINK}
                className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/20 transition"
              >
                Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
