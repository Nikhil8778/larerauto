"use client";

type Props = {
  regularPriceCents: number;
  tradeDiscountPct?: number;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

export default function MechanicPriceBox({
  regularPriceCents,
  tradeDiscountPct = 10,
}: Props) {
  const discountCents = Math.round(regularPriceCents * (tradeDiscountPct / 100));
  const mechanicPriceCents = regularPriceCents - discountCents;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="mb-2 text-sm font-semibold text-amber-900">
        Mechanic Trade Pricing
      </div>

      <div className="space-y-1 text-sm text-gray-800">
        <div>Regular Price: <strong>{money(regularPriceCents)}</strong></div>
        <div>
          Your Trade Price: <strong>{money(mechanicPriceCents)}</strong>
        </div>
        <div>
          You Save: <strong>{money(discountCents)}</strong> ({tradeDiscountPct}%)
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        Taxes and delivery charges are extra.
      </div>
    </div>
  );
}