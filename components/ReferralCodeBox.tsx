"use client";

import { useState } from "react";

type Props = {
  itemPriceCents: number;
};

export default function ReferralCodeBox({ itemPriceCents }: Props) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);

  async function applyCode() {
    setMessage("");
    setDiscountedPrice(null);

    const res = await fetch("/api/referral/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setMessage(data.message || "Invalid code.");
      return;
    }

    const pct = Number(data.referral.customerDiscountPct || 0);
    const discountCents = Math.round(itemPriceCents * (pct / 100));
    const newPrice = itemPriceCents - discountCents;

    setDiscountedPrice(newPrice);
    setMessage(
      `Referral code applied. You saved ${pct}% on item price only. Taxes and delivery are extra.`
    );
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 text-sm font-medium">Mechanic Referral Code</div>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter referral code"
          className="flex-1 rounded-xl border px-4 py-3"
        />
        <button
          type="button"
          onClick={applyCode}
          className="rounded-xl bg-black px-4 py-3 text-white"
        >
          Apply
        </button>
      </div>

      {message ? <p className="mt-3 text-sm">{message}</p> : null}

      {discountedPrice !== null ? (
        <p className="mt-2 text-sm font-semibold">
          Discounted item price: ${(discountedPrice / 100).toFixed(2)} CAD
        </p>
      ) : null}
    </div>
  );
}