"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ✅ Same part names as your Quote form + Catalog
const PART_TYPES = [
  "Alternators",
  "Starters",
  "Batteries",
  "Lights & Bulbs",
  "Fuses",
  "Brake Pads",
  "Rotors",
  "Calipers",
  "Bearings",
  "Wheel Bearings",
  "Brake Drum",
  "Wheel Bearing",
  "Control Arms",
  "Sway Bar Links",
  "Struts",
  "Shocks",
  "AC Compressor",
  "AC Condenser & Evaporator",
  "Tensioners & Pulleys",
  "Blower Motor",
  "Radiators",
  "Fuel Injectors",
  "Fuel Pumps",
  "Fuel Tanks",
  "Timing Belts",
  "Gaskets",
  "Spark Plugs",
];

// ✅ Map part -> image (use YOUR existing product images)
const img: Record<string, string> = {
  "Brake Pads": "/products/Brake-Pads.webp",
  Rotors: "/products/Rotors.webp",
  Calipers: "/products/Calipers.jpg",
  Bearings: "/products/Bearings.jpg",
  "Wheel Bearings": "/products/Wheel-Bearings.png",
  "Brake Drum": "/products/Brake-Drum.jpg",
  Alternators: "/products/Alternators.png",
  Starters: "/products/Starters.webp",
  Batteries: "/products/Batteries.jpg",
  "Lights & Bulbs": "/products/Lights-Bulb.jpg",
  Fuses: "/products/Fuses.jpg",
  "Control Arms": "/products/Control-Arms.webp",
  "Wheel Bearing": "/products/Wheel-Bearings.png",
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
  "Spark Plugs": "/products/Spark-Plugs.webp",
};

// ✅ Map part -> description (simple demo text)
const desc: Record<string, string> = {
  Alternators: "Your vehicle’s alternator is the heart of its electrical system. It generates power while the engine is running, recharges the battery, and keeps essential components like headlights, dashboard electronics, infotainment systems, and power windows operating smoothly. A failing alternator can cause dim lights, battery warning indicators, difficulty starting, or sudden breakdowns. We offer high-quality alternators engineered for durability, consistent voltage output, and long service life. Whether you need a new replacement or a heavy-duty upgrade, our alternators meet OEM standards for reliable performance. Designed for a wide range of makes and models, each unit is tested to ensure optimal charging efficiency and fitment. Don’t let electrical problems leave you stranded — choose a dependable alternator that restores full power to your vehicle and keeps you confidently on the road in all driving conditions.",
  Starters: "Reliable starter replacement. Fitment confirmed by your vehicle details.",
  Batteries: "Battery option selected for your vehicle. Fitment confirmed by your vehicle details.",
  "Brake Pads": "Quiet braking + strong stopping power. Fitment confirmed by your vehicle details.",
  Rotors: "Balanced braking performance and durability. Fitment confirmed by your vehicle details.",
  Calipers:"",
  Bearings:"",
  "Brake Drum": "Durable brake drum replacement. Fitment confirmed by your vehicle details.",
  "Wheel Bearings": "Smooth rolling and reduced noise. Fitment confirmed by your vehicle details.",
  "Control Arms": "Steering stability + suspension support. Fitment confirmed by your vehicle details.",
  "Lights & Bulbs": "Replacement lights and bulbs. Fitment confirmed by your vehicle details.",
  Fuses: "Correct fuse type based on your selection. Fitment confirmed by your vehicle details.",
  "Sway Bar Links": "",
  Struts: "",
  Shocks: "",
  "AC Compressor": "",
  "AC Condenser & Evaporator": "",
  "Tensioners & Pulleys": "",
  "Blower Motor": "",
  Radiators: "",
  "Fuel Injectors": "",
  "Fuel Pumps": "",
  "Fuel Tanks": "",
  "Timing Belts": "",
  Gaskets: "",
  "Spark Plugs": "",
};

// ✅ Demo prices (change later to distributor pricing)
const basePrice: Record<string, number> = {
  Alternators: 205,
  Starters: 189,
  Batteries: 160,
  "Brake Pads": 79,
  Rotors: 120,
  Calipers: 130,
  Bearings: 35,
  "Brake Drum": 95,
  "Wheel Bearings": 110,
  "Control Arms": 140,
  "Lights & Bulbs": 55,
  Fuses: 18,
  "Sway Bar Links": 65,
  Struts: 160,
  Shocks: 145,
  "AC Compressor": 260,
  "AC Condenser & Evaporator": 220,
  "Tensioners & Pulleys": 95,
  "Blower Motor": 120,
  Radiators: 210,
  "Fuel Injectors": 150,
  "Fuel Pumps": 180,
  "Fuel Tanks": 240,
  "Timing Belts": 85,
  Gaskets: 45,
  "Spark Plugs": 30,
};

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default function QuoteResultPage() {
  const sp = useSearchParams();
  const router = useRouter();

  // reading form params
  const partTypeRaw = sp.get("partType") || "Batteries";
  const partType = PART_TYPES.includes(partTypeRaw) ? partTypeRaw : "Batteries";

  const year = sp.get("year") || "";
  const make = sp.get("make") || "";
  const model = sp.get("model") || "";
  const vin = sp.get("vin") || "";

  // demo computed values
  const data = useMemo(() => {
    const price = basePrice[partType] ?? 160;
    const stock = Math.floor(Math.random() * 6) + 1; // demo: 1..6
    return {
      price,
      stock,
      src: img[partType] || "/products/placeholder.png",
      description:
        desc[partType] || "Quality replacement part. Fitment confirmed by your vehicle details.",
    };
  }, [partType]);

  function goCheckout(mode: "cart" | "buy") {
    // ✅ IMPORTANT: We pass price so checkout never becomes 0.00
    const params = new URLSearchParams({
      partType,
      price: String(data.price),
      qty: "1",
      mode,
      year,
      make,
      model,
      vin,
    });

    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT: Product card */}
        <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/70">
              <Image src={data.src} alt={partType} fill className="object-contain p-2" />
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                In Stock ({data.stock})
              </div>

              <div className="mt-3 text-sm font-semibold text-slate-700">
                {data.description}
              </div>

              {(year || make || model) && (
                <div className="mt-2 text-xs font-medium text-slate-600">
                  Fitment: {year} {make} {model} {vin ? `• VIN: ${vin}` : ""}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/70 p-5">
            <div className="text-sm font-bold text-slate-700">Item price</div>
            <div className="mt-1 text-3xl font-black text-slate-900">{money(data.price)}</div>
            <div className="mt-2 text-xs font-medium text-slate-600">
              Taxes and delivery are calculated at checkout after you enter your address.
            </div>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
          <div className="text-lg font-black text-slate-900">Next</div>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Add to cart or buy now. You’ll enter your address on the next step to calculate delivery + HST.
          </p>

          <button
            onClick={() => goCheckout("cart")}
            className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Add to Cart
          </button>

          <button
            onClick={() => goCheckout("buy")}
            className="mt-3 w-full rounded-full border border-slate-900/20 bg-white/80 py-3 text-sm font-extrabold text-slate-900 hover:bg-white"
          >
            Buy Now
          </button>

          <Link
            href="/catalog"
            className="mt-4 block text-center text-sm font-semibold text-slate-700 hover:underline"
          >
            ← Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}