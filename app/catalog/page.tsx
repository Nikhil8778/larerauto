import Image from "next/image";
import Link from "next/link";

const categories = [
  { name: "Brakes", subs: ["Brake Pads", "Rotors", "Calipers", "Bearings", "Brake Drum"] },
  { name: "Electrical", subs: ["Alternators", "Starters", "Batteries", "Lights & Bulbs", "Fuses"] },
  { name: "Suspension", subs: ["Control Arms", "Wheel Bearings", "Sway Bar Links", "Struts", "Shocks"] },
  {
    name: "Heating & Cooling",
    subs: ["AC Compressor", "AC Condenser & Evaporator", "Tensioners & Pulleys", "Blower Motor", "Radiators"],
  },
  { name: "Fuel & Emission", subs: ["Fuel Injectors", "Fuel Pumps", "Fuel Tanks"] },
  { name: "Engine Parts", subs: ["Timing Belts", "Gaskets", "Spark Plugs"] },
];

const img: Record<string, string> = {
  "Brake Pads": "/products/Brake-Pads.webp",
  Rotors: "/products/Rotors.webp",
  Calipers: "/products/Calipers.jpg",
  Bearings: "/products/Bearings.jpg",
  "Brake Drum": "/products/Brake-Drum.jpg",
  Alternators: "/products/Alternators.png",
  Starters: "/products/Starters.webp",
  Batteries: "/products/Batteries.jpg",
  "Lights & Bulbs": "/products/Lights-Bulb.jpg",
  Fuses: "/products/Fuses.jpg",
  "Control Arms": "/products/Control-Arms.webp",
  "Wheel Bearings": "/products/Wheel-Bearings.png",
  "Sway Bar Links": "/products/Sway-Bar-Links.jpg",
  Struts: "/products/Struts.jpg",
  Shocks: "/products/Shocks.jpg",
  "AC Compressor": "/products/AC-Compressor.jpg",
  "AC Condenser & Evaporator": "/products/AC-Evaporator.jpg",
  "Tensioners & Pulleys": "/products/Tensioners-Pulleys.jpg",
  "Blower Motor": "/products/Blower-Motor.jpg",
  Radiators: "/products/Radiators.jpg",
  "Fuel Injectors": "/products/Fuel-Injectors.jpg",
  "Fuel Pumps": "/products/Fuel-Pumps.webp",
  "Fuel Tanks": "/products/Fuel-Tanks.jpg",
  "Timing Belts": "/products/Timing-Belts.jpg",
  Gaskets: "/products/Gaskets.jpg",
  "Spark Plugs": "/products/Spark-plugs.webp",
};

function partHref(part: string) {
  return `/quote?partType=${encodeURIComponent(part)}`;
}

function PartTile({ part }: { part: string }) {
  const src = img[part]?.trim() || "/products/placeholder.png";

  return (
    <Link href={partHref(part)} className="block" title={`Get quote for ${part}`}>
      <div className="group rounded-2xl bg-white/85 backdrop-blur border border-white/60 shadow-sm px-3 py-3 text-center transition hover:bg-white">
        <div className="flex min-h-[150px] flex-col items-center">
          <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-xl bg-white/70">
            <Image
              src={src}
              alt={part}
              width={90}
              height={60}
              className="max-h-14 w-auto object-contain transition group-hover:scale-105"
            />
          </div>

          <div className="px-1 text-sm font-semibold text-slate-900 leading-snug break-words">
            {part}
          </div>

          <div className="mt-auto pt-2 text-xs text-slate-500 leading-tight">
            Tap for quote
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({ name, subs }: { name: string; subs: string[] }) {
  return (
    <section className="rounded-3xl bg-white/22 backdrop-blur-xl border border-white/45 shadow-xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">{name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose a category and tap a part to jump to Instant Quote.
          </p>
        </div>

        <Link
          href={partHref(subs[0])}
          className="inline-flex h-9 items-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          Quote
        </Link>
      </div>

      {/* ONE grid only (no duplicates) */}
      <div className="mt-5 grid grid-cols-4 gap-3">
        {subs.slice(0, 5).map((p) => (
          <PartTile key={`${name}-${p}`} part={p} />
        ))}
      </div>
    </section>
  );
}

export default function CatalogPage() {
  const top = categories.slice(0, 2);
  const rest = categories.slice(2);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
      {/* main frosted panel like screenshot-1 */}
      <div className="rounded-[36px] bg-white/14 backdrop-blur-xl border border-white/35 shadow-2xl px-10 py-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
          Products &amp; Services
        </h1>

        <p className="mt-3 max-w-2xl text-base text-slate-700">
          Choose a category and tap a part to jump to Instant Quote.
        </p>

        <div className="mt-6 flex gap-4">
          <Link
            href="/quote"
            className="inline-flex h-11 items-center rounded-full bg-slate-900 px-7 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            Instant Quote
          </Link>

          <Link
            href="/about"
            className="inline-flex h-11 items-center rounded-full bg-white/75 px-7 text-sm font-semibold text-slate-900 shadow hover:bg-white"
          >
            About Us
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {top.map((c) => (
            <CategoryCard key={c.name} name={c.name} subs={c.subs} />
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {rest.map((c) => (
          <CategoryCard key={c.name} name={c.name} subs={c.subs} />
        ))}
      </div>
    </div>
  );
}