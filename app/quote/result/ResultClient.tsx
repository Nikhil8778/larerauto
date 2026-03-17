"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type BestOffer = {
  offerId: string;
  partType: string;
  title: string;
  description: string;
  imageUrl: string;
  stockQty: number;
  itemPrice: number;
};

type ResultClientProps = {
  bestOffer: BestOffer | null;
};

function money(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

export default function ResultClient({ bestOffer }: ResultClientProps) {
  const sp = useSearchParams();

  const year = sp.get("year") || "";
  const make = sp.get("make") || "";
  const model = sp.get("model") || "";
  const engine = sp.get("engine") || "";
  const partType = sp.get("partType") || "";

  if (!bestOffer) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <h1 className="text-4xl font-black text-slate-900">Quote Result</h1>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            {partType} • {year} • {make} • {model} • {engine}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/40 bg-white/25 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-3xl font-black text-slate-900">No offers found</div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Try changing make/model/engine/year or go back to catalog.
          </p>

          <Link
            href="/catalog"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const checkoutHref = `/checkout?offerId=${encodeURIComponent(
    bestOffer.offerId
  )}&partType=${encodeURIComponent(bestOffer.partType)}&price=${encodeURIComponent(
    String(bestOffer.itemPrice)
  )}&qty=1`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-black text-slate-900">Quote Result</h1>
        <div className="mt-2 text-sm font-semibold text-slate-700">
          {partType} • {year} • {make} • {model} • {engine}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/70 text-sm font-bold text-slate-500">
              {bestOffer.imageUrl ? (
                <img
                  src={bestOffer.imageUrl}
                  alt={bestOffer.title}
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                "No image"
              )}
            </div>

            <div className="flex-1">
              <div className="inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-extrabold text-emerald-700">
                In Stock ({bestOffer.stockQty})
              </div>

              <h2 className="mt-3 text-4xl font-black text-slate-900">
                {bestOffer.title}
              </h2>

              <p className="mt-2 text-lg font-medium text-slate-700">
                {bestOffer.description}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] bg-white/70 p-6">
            <div className="text-xl font-bold text-slate-700">Item price</div>
            <div className="mt-2 text-6xl font-black text-slate-900">
              {money(bestOffer.itemPrice)}
            </div>
            <p className="mt-3 text-base font-medium text-slate-600">
              Taxes and delivery are calculated at checkout after you enter your
              address.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <h3 className="text-3xl font-black text-slate-900">Next</h3>
          <p className="mt-3 text-base font-medium text-slate-700">
            Add to cart or buy now. You&apos;ll enter your address on the next
            step to calculate delivery + HST.
          </p>

          <div className="mt-6 space-y-4">
            <Link
              href={checkoutHref}
              className="flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-4 text-base font-extrabold text-white hover:bg-slate-800"
            >
              Add to Cart
            </Link>

            <Link
              href={checkoutHref}
              className="flex w-full items-center justify-center rounded-full bg-white px-6 py-4 text-base font-extrabold text-slate-900 hover:bg-slate-100"
            >
              Buy Now
            </Link>
          </div>

          <Link
            href="/catalog"
            className="mt-6 inline-flex text-base font-bold text-slate-700 hover:text-slate-900"
          >
            ← Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}