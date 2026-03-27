"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import MechanicOfferActions from "@/components/MechanicOfferActions";

type BestOffer = {
  offerId: string;
  partType: string;
  title: string;
  description: string;
  imageUrl: string;
  stockQty: number;
  itemPrice: number;
  itemPriceCents: number;
  currency?: string;
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
  const router = useRouter();
  const sp = useSearchParams();
  const [saving, setSaving] = useState(false);

  const year = sp.get("year") || "";
  const make = sp.get("make") || "";
  const model = sp.get("model") || "";
  const engine = sp.get("engine") || "";
  const partType = sp.get("partType") || "";
  const vin = sp.get("vin") || "";

  const utmSource = sp.get("utm_source") || "";
  const utmMedium = sp.get("utm_medium") || "";
  const utmCampaign = sp.get("utm_campaign") || "";
  const sourceChannel = sp.get("source_channel") || utmSource || "";

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

  const offer = bestOffer;

  async function saveQuoteAndGo(mode: "cart" | "buy") {
  if (saving) return;
  setSaving(true);

  try {
    console.log("saveQuoteAndGo clicked", { mode });

    const dedupeKey = [
      year,
      make,
      model,
      engine,
      partType,
      vin,
      offer.offerId,
      utmSource,
      utmMedium,
      utmCampaign,
      mode,
    ].join("|");

    const alreadySaved = sessionStorage.getItem(`quote_saved_${dedupeKey}`);
    console.log("alreadySaved:", alreadySaved);

    if (!alreadySaved) {
      const payload = {
        year,
        make,
        model,
        engine,
        partType,
        vin,
        bestOfferId: offer.offerId || null,
        itemPriceCents: offer.itemPriceCents,
        utmSource,
        utmMedium,
        utmCampaign,
        sourceChannel,
      };

      console.log("POST /api/quotes payload:", payload);

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("POST /api/quotes status:", res.status);

      const data = await res.json().catch(() => null);
      console.log("POST /api/quotes response:", data);

      if (!res.ok) {
        console.error("Failed to save quote");
        return;
      }

      sessionStorage.setItem(`quote_saved_${dedupeKey}`, "1");
    }

    const checkoutParams = new URLSearchParams({
      offerId: offer.offerId,
      partType: offer.partType,
      price: String(offer.itemPrice),
      qty: "1",
      mode,
    });

    if (utmSource) checkoutParams.set("utm_source", utmSource);
    if (utmMedium) checkoutParams.set("utm_medium", utmMedium);
    if (utmCampaign) checkoutParams.set("utm_campaign", utmCampaign);
    if (sourceChannel) checkoutParams.set("source_channel", sourceChannel);

    router.push(`/checkout?${checkoutParams.toString()}`);
  } catch (error) {
    console.error("saveQuoteAndGo error:", error);
  } finally {
    setSaving(false);
  }
}

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
              {offer.imageUrl ? (
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                "No image"
              )}
            </div>

            <div className="flex-1">
              <div className="inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-extrabold text-emerald-700">
                In Stock ({offer.stockQty})
              </div>

              <h2 className="mt-3 text-4xl font-black text-slate-900">
                {offer.title}
              </h2>

              <p className="mt-2 text-lg font-medium text-slate-700">
                {offer.description}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] bg-white/70 p-6">
            <div className="text-xl font-bold text-slate-700">Item price</div>
            <div className="mt-2 text-6xl font-black text-slate-900">
              {money(offer.itemPrice)}
            </div>
            <p className="mt-3 text-base font-medium text-slate-600">
              Taxes and delivery are calculated at checkout after you enter your
              address.
            </p>
          </div>

          <MechanicOfferActions
            offerId={offer.offerId}
            partType={offer.partType}
            regularPriceCents={offer.itemPriceCents}
            currency={offer.currency || "CAD"}
          />
        </div>

        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <h3 className="text-3xl font-black text-slate-900">Next</h3>
          <p className="mt-3 text-base font-medium text-slate-700">
            Add to cart or buy now. You&apos;ll enter your address on the next
            step to calculate delivery + HST.
          </p>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => saveQuoteAndGo("cart")}
              disabled={saving}
              className="flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-4 text-base font-extrabold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add to Cart"}
            </button>

            <button
              type="button"
              onClick={() => saveQuoteAndGo("buy")}
              disabled={saving}
              className="flex w-full items-center justify-center rounded-full bg-white px-6 py-4 text-base font-extrabold text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Buy Now"}
            </button>
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