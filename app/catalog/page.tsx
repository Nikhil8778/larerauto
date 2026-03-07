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
    <Link href={partHref(part)} className="block h-full" title={`Get quote for ${part}`}>
      <div className="group h-full rounded-2xl border border-white/60 bg-white/85 px-2 py-3 text-center shadow-sm backdrop-blur transition hover:bg-white sm:px-3">
        <div className="flex min-h-[150px] flex-col items-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl bg-white/70 sm:h-[72px] sm:w-[72px]">
            <Image
              src={src}
              alt={part}
              width={90}
              height={60}
              className="max-h-14 w-auto object-contain transition group-hover:scale-105"
            />
          </div>

          <div className="px-1 text-sm font-semibold leading-tight text-slate-900 break-words">
            {part}
          </div>

          <div className="mt-auto pt-2 text-xs leading-tight text-slate-500">
            Tap for quote
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategoryCard({ name, subs }: { name: string; subs: string[] }) {
  return (
    <section className="rounded-3xl border border-white/45 bg-white/22 p-4 shadow-xl backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose a category and tap a part to jump to Instant Quote.
          </p>
        </div>

        <Link
          href={partHref(subs[0])}
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white shadow hover:bg-slate-800"
        >
          Quote
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
      {/* Main frosted panel */}
      <div className="rounded-[30px] border border-white/35 bg-white/14 px-5 py-6 shadow-2xl backdrop-blur-xl sm:rounded-[36px] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Products &amp; Services
        </h1>

        <p className="mt-3 max-w-2xl text-base text-slate-700">
          Choose a category and tap a part to jump to Instant Quote.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/quote"
            className="inline-flex h-11 items-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            Instant Quote
          </Link>

          <Link
            href="/about"
            className="inline-flex h-11 items-center rounded-full bg-white/75 px-6 text-sm font-semibold text-slate-900 shadow hover:bg-white"
          >
            About Us
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
          {top.map((c) => (
            <CategoryCard key={c.name} name={c.name} subs={c.subs} />
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
        {rest.map((c) => (
          <CategoryCard key={c.name} name={c.name} subs={c.subs} />
        ))}
      </div>
    </div>
  );
}