"use client";

import { useMemo, useState } from "react";

type DecodedVehicle = {
  vin: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  trim: string;
};

type OfferRow = {
  offerId: string;
  partId: string;
  partType: string;
  title: string;
  sellPriceCents: number;
  selectedPriceCents: number | null;
  amazonPriceCents: number | null;
  aPremiumPriceCents: number | null;
  sourceId: string;
  syncStatus: string | null;
  amazonUrl: string | null;
  aPremiumUrl: string | null;
};

type FitmentResult = {
  matched: boolean;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    engine: string;
  } | null;
  offers: OfferRow[];
  message?: string;
};

function formatMoney(cents: number | null) {
  if (cents === null) return "-";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default function VinLookupPage() {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [decodeError, setDecodeError] = useState("");
  const [fitmentError, setFitmentError] = useState("");
  const [decoded, setDecoded] = useState<DecodedVehicle | null>(null);
  const [fitment, setFitment] = useState<FitmentResult | null>(null);
  const [selectedPartType, setSelectedPartType] = useState("");

  const uniquePartTypes = useMemo(() => {
    const types = fitment?.offers.map((x) => x.partType) ?? [];
    return [...new Set(types)].sort();
  }, [fitment]);

  const filteredOffers = useMemo(() => {
    const offers = fitment?.offers ?? [];
    if (!selectedPartType) return offers;
    return offers.filter((x) => x.partType === selectedPartType);
  }, [fitment, selectedPartType]);

  async function handleLookup() {
    setLoading(true);
    setDecodeError("");
    setFitmentError("");
    setDecoded(null);
    setFitment(null);
    setSelectedPartType("");

    try {
      const decodeRes = await fetch(`/api/vin/decode?vin=${encodeURIComponent(vin)}`, {
        cache: "no-store",
      });

      const decodeData = await decodeRes.json();

      if (!decodeRes.ok) {
        setDecodeError(decodeData.error ?? "VIN decode failed");
        return;
      }

      setDecoded(decodeData);

      const fitmentRes = await fetch(
        `/api/vin/fitment?make=${encodeURIComponent(decodeData.make)}&model=${encodeURIComponent(
          decodeData.model
        )}&year=${encodeURIComponent(String(decodeData.year))}&engine=${encodeURIComponent(
          decodeData.engine ?? ""
        )}`,
        { cache: "no-store" }
      );

      const fitmentData = await fitmentRes.json();

      if (!fitmentRes.ok) {
        setFitmentError(fitmentData.error ?? "Fitment lookup failed");
        return;
      }

      setFitment(fitmentData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">VIN Lookup</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter VIN to identify the vehicle, match fitment, and view best offers.
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="Enter 17-character VIN"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Checking..." : "Decode VIN"}
          </button>
        </div>

        {decodeError ? (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {decodeError}
          </div>
        ) : null}

        {fitmentError ? (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {fitmentError}
          </div>
        ) : null}
      </div>

      {decoded ? (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Decoded Vehicle</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Make</div>
              <div className="mt-1 font-semibold">{decoded.make}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Model</div>
              <div className="mt-1 font-semibold">{decoded.model}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Year</div>
              <div className="mt-1 font-semibold">{decoded.year}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Engine</div>
              <div className="mt-1 font-semibold">{decoded.engine || "-"}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Trim</div>
              <div className="mt-1 font-semibold">{decoded.trim || "-"}</div>
            </div>
          </div>
        </div>
      ) : null}

      {fitment?.matched ? (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Matched Vehicle</h2>
              <p className="mt-1 text-sm text-slate-600">
                {fitment.vehicle?.year} {fitment.vehicle?.make} {fitment.vehicle?.model}{" "}
                {fitment.vehicle?.engine}
              </p>
            </div>

            <div className="w-full md:w-72">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filter by part type
              </label>
              <select
                value={selectedPartType}
                onChange={(e) => setSelectedPartType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="">All Parts</option>
                {uniquePartTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Part Type</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Amazon</th>
                  <th className="px-4 py-3 font-semibold">A-Premium</th>
                  <th className="px-4 py-3 font-semibold">Selected Price</th>
                  <th className="px-4 py-3 font-semibold">Sell Price</th>
                  <th className="px-4 py-3 font-semibold">Chosen Vendor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => (
                  <tr key={offer.offerId} className="border-t align-top">
                    <td className="px-4 py-3">{offer.partType}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-[280px] break-words">{offer.title}</div>
                    </td>

                    <td className="px-4 py-3">
                      {offer.amazonUrl ? (
                        <a
                          href={offer.amazonUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          {formatMoney(offer.amazonPriceCents)}
                        </a>
                      ) : (
                        formatMoney(offer.amazonPriceCents)
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {offer.aPremiumUrl ? (
                        <a
                          href={offer.aPremiumUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          {formatMoney(offer.aPremiumPriceCents)}
                        </a>
                      ) : (
                        formatMoney(offer.aPremiumPriceCents)
                      )}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(offer.selectedPriceCents)}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(offer.sellPriceCents)}
                    </td>

                    <td className="px-4 py-3 capitalize">{offer.sourceId}</td>
                    <td className="px-4 py-3 capitalize">{offer.syncStatus ?? "-"}</td>
                  </tr>
                ))}

                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                      No matching offers found for this filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {fitment && !fitment.matched ? (
        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Fitment Result</h2>
          <p className="mt-2 text-sm text-slate-600">
            {fitment.message ?? "No local vehicle match found."}
          </p>
        </div>
      ) : null}
    </div>
  );
}