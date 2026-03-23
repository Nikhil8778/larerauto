"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MechanicPriceBox from "@/components/MechanicPriceBox";

type MechanicMeResponse = {
  success: boolean;
  mechanic?: {
    id: string;
    shopName: string;
    contactName: string;
    email: string;
    tradeDiscountPct: number;
    referralDiscountPct: number;
    isApproved: boolean;
  };
};

type Props = {
  offerId: string;
  partType: string;
  regularPriceCents: number;
  currency?: string;
  defaultQuantity?: number;
};

function money(cents: number, currency = "CAD") {
  return `$${(cents / 100).toFixed(2)} ${currency}`;
}

export default function MechanicOfferActions({
  offerId,
  partType,
  regularPriceCents,
  currency = "CAD",
  defaultQuantity = 1,
}: Props) {
  const router = useRouter();

  const [loadingMechanic, setLoadingMechanic] = useState(true);
  const [mechanic, setMechanic] = useState<MechanicMeResponse["mechanic"] | null>(null);
  const [quantity, setQuantity] = useState(defaultQuantity);

  useEffect(() => {
    let ignore = false;

    async function loadMechanic() {
      try {
        const res = await fetch("/api/mechanic/me", {
          method: "GET",
          cache: "no-store",
        });

        const data: MechanicMeResponse = await res.json();

        if (!ignore && res.ok && data.success && data.mechanic?.isApproved) {
          setMechanic(data.mechanic);
        }
      } catch {
        // silent for normal customer view
      } finally {
        if (!ignore) {
          setLoadingMechanic(false);
        }
      }
    }

    loadMechanic();

    return () => {
      ignore = true;
    };
  }, []);

  const computed = useMemo(() => {
    if (!mechanic) return null;

    const discountPct = Number(mechanic.tradeDiscountPct || 10);
    const discountCents = Math.round(regularPriceCents * (discountPct / 100));
    const tradePriceCents = Math.max(0, regularPriceCents - discountCents);

    return {
      discountPct,
      discountCents,
      tradePriceCents,
      lineTotalCents: tradePriceCents * quantity,
    };
  }, [mechanic, regularPriceCents, quantity]);

  function goToMechanicCheckout() {
    if (!offerId || !mechanic) return;

    const params = new URLSearchParams({
      offerId,
      qty: String(quantity),
      mode: "mechanic",
      partType,
    });

    router.push(`/checkout?${params.toString()}`);
  }

  if (loadingMechanic || !mechanic || !offerId) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[28px] border border-amber-300 bg-amber-50/70 p-6 shadow-xl">
      <MechanicPriceBox
        regularPriceCents={regularPriceCents}
        tradeDiscountPct={mechanic.tradeDiscountPct}
        currency={currency}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-[140px_1fr] md:items-end">
        <label className="block">
          <div className="mb-2 text-sm font-bold text-slate-700">Quantity</div>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              const next = Number(e.target.value || 1);
              setQuantity(next > 0 ? next : 1);
            }}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/15"
          />
        </label>

        <div className="rounded-2xl border border-black/10 bg-white px-4 py-4">
          <div className="text-sm font-bold text-slate-700">Trade Line Total</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {money(computed?.lineTotalCents || 0, currency)}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-600">
            Taxes and delivery charges are extra.
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={goToMechanicCheckout}
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
        >
          Proceed to Mechanic Checkout
        </button>

        <a
          href="/mechanic-dashboard"
          className="rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-100"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}