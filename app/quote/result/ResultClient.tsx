"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/pricing";

type Props = {
  query: { partType: string; year: string; make: string; model: string; vin?: string };
  offer: null | {
    offerId: string;
    partType: string;
    title: string;
    description: string;
    imageUrl: string;
    stockQty: number;
    itemPrice: number;
  };
};

export default function ResultClient({ query, offer }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-3xl font-black text-slate-900">Quote Result</h1>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {query.partType} • {query.year} • {query.make} • {query.model}
        </p>
      </div>

      {!offer ? (
        <div className="mt-8 rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
          <div className="text-lg font-extrabold text-slate-900">No offers found</div>
          <p className="mt-2 text-sm text-slate-700">
            Try changing make/model/year or go back to catalog.
          </p>
          <Link className="mt-4 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white" href="/catalog">
            Back to Catalog
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left: product */}
          <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white/70 border border-white/60 flex items-center justify-center">
                {offer.imageUrl ? (
                  // If you use external URLs, add domain in next.config.js images.domains
                  <Image src={offer.imageUrl} alt={offer.title} width={96} height={96} />
                ) : (
                  <div className="text-xs font-bold text-slate-500">No image</div>
                )}
              </div>

              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {offer.stockQty > 0 ? `In Stock (${offer.stockQty})` : "Out of stock"}
                </div>

                <h2 className="mt-3 text-lg font-black text-slate-900">{offer.title}</h2>
                <p className="mt-2 text-sm font-medium text-slate-700">{offer.description}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-5">
              <div className="text-sm font-bold text-slate-700">Item price</div>
              <div className="mt-1 text-4xl font-black text-slate-900">
                {formatMoney(offer.itemPrice)}
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-600">
                Taxes and delivery are calculated at checkout after you enter your address.
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
            <div className="text-lg font-black text-slate-900">Next</div>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Add to cart or buy now. You’ll enter your address on the next step to calculate delivery + HST.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href={`/cart?offerId=${offer.offerId}`}
                className="block w-full rounded-full bg-slate-900 px-6 py-3 text-center text-sm font-extrabold text-white hover:bg-slate-800"
              >
                Add to Cart
              </Link>

              <Link
                href={`/checkout?offerId=${offer.offerId}`}
                className="block w-full rounded-full border border-slate-900/20 bg-white/70 px-6 py-3 text-center text-sm font-extrabold text-slate-900 hover:bg-white"
              >
                Buy Now
              </Link>

              <Link className="block text-center text-sm font-bold text-slate-700 hover:text-slate-900" href="/catalog">
                ← Back to Catalog
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}