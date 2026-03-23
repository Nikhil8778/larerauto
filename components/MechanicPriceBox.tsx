"use client";

type Props = {
  regularPriceCents: number;
  tradeDiscountPct?: number;
  currency?: string;
};

function money(cents: number, currency = "CAD") {
  return `$${(cents / 100).toFixed(2)} ${currency}`;
}

export default function MechanicPriceBox({
  regularPriceCents,
  tradeDiscountPct = 10,
  currency = "CAD",
}: Props) {
  const discountCents = Math.round(regularPriceCents * (tradeDiscountPct / 100));
  const mechanicPriceCents = Math.max(0, regularPriceCents - discountCents);

  return (
    <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-5">
      <div className="text-sm font-extrabold uppercase tracking-wide text-amber-800">
        Mechanic Trade Pricing
      </div>

      <div className="mt-4 space-y-2 text-sm font-semibold text-slate-800">
        <div>
          Regular Price: <span className="font-black">{money(regularPriceCents, currency)}</span>
        </div>
        <div>
          Your Trade Price:{" "}
          <span className="font-black">{money(mechanicPriceCents, currency)}</span>
        </div>
        <div>
          You Save: <span className="font-black">{money(discountCents, currency)}</span> (
          {tradeDiscountPct}%)
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-600">
        Taxes and delivery charges are extra.
      </p>
    </div>
  );
}