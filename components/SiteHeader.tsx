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
    <header className="w-full border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
      {/* This is the ONLY container you need */}
      <div className="mx-auto flex h-[76px] max-w-6xl items-center gap-6 px-4 md:h-[84px] md:px-6">
        {/* LEFT: Logo */}
        <Link href="/catalog" className="flex items-center">
          <Image
            src="/brand/lare-automotive-logo.png"
            alt="LARE AUTOMOTIVE"
            width={420}
            height={120}
            priority
            className="h-[174px] md:h-[182px] w-auto object-contain" // bigger logo but clean
          />
        </Link>

        {/* CENTER: Nav (takes remaining space so it centers nicely) */}
        <nav className="hidden flex-1 md:flex">
          <ul className="mx-auto flex items-center gap-10 text-sm font-semibold text-white/85">
            <li>
              <Link className="whitespace-nowrap hover:text-white transition" href="/about">
                About Us
              </Link>
            </li>
            <li>
              <Link className="hover:text-white transition" href="/catalog">
                Parts
              </Link>
            </li>
            <li>
              <Link className="whitespace-nowrap hover:text-white transition" href="/quote">
                Instant Quote
              </Link>
            </li>
            <li>
              <Link className="hover:text-white transition" href="/reviews">
                Reviews
              </Link>
            </li>
            <li>
              <Link className="whitespace-nowrap hover:text-white transition" href="/contact">
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>

        {/* RIGHT: Buttons */}
        <div className="ml-auto flex items-center gap-3">
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
    </header>
  );
}
