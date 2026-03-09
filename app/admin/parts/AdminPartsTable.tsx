"use client";

import { useState } from "react";

type AdminPartRow = {
  offerId: string;
  make: string;
  model: string;
  engine: string;
  year: number;
  partType: string;
  title: string;
  inventoryQty: number;
  sellPriceCents: number;
  currency: string;
  sourceId: string;
};

function formatMoneyFromCents(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default function AdminPartsTable({
  rows,
}: {
  rows: AdminPartRow[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function saveRow(offerId: string) {
    const invInput = document.getElementById(`inv-${offerId}`) as HTMLInputElement | null;
    const priceInput = document.getElementById(`price-${offerId}`) as HTMLInputElement | null;

    if (!invInput || !priceInput) return;

    const inventoryQty = Number(invInput.value);
    const sellPriceCents = Math.round(Number(priceInput.value) * 100);

    setLoadingId(offerId);

    try {
      const res = await fetch("/api/admin/update-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerId,
          inventoryQty,
          sellPriceCents,
        }),
      });

      if (!res.ok) {
        alert("Failed to update offer.");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-bold text-slate-700">
              <th className="px-4 py-4">Make</th>
              <th className="px-4 py-4">Model</th>
              <th className="px-4 py-4">Engine</th>
              <th className="px-4 py-4">Year</th>
              <th className="px-4 py-4">Part Type</th>
              <th className="px-4 py-4">Title</th>
              <th className="px-4 py-4">Inventory</th>
              <th className="px-4 py-4">Sell Price</th>
              <th className="px-4 py-4">Source</th>
              <th className="px-4 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                >
                  No part rows found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.offerId}
                  className="border-t border-slate-100 text-sm text-slate-800"
                >
                  <td className="px-4 py-4">{row.make}</td>
                  <td className="px-4 py-4">{row.model}</td>
                  <td className="px-4 py-4">{row.engine}</td>
                  <td className="px-4 py-4">{row.year}</td>
                  <td className="px-4 py-4">{row.partType}</td>
                  <td className="px-4 py-4">{row.title}</td>

                  <td className="px-4 py-4">
                    <input
                      id={`inv-${row.offerId}`}
                      defaultValue={row.inventoryQty}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                    />
                  </td>

                  <td className="px-4 py-4">
                    <input
                      id={`price-${row.offerId}`}
                      defaultValue={(row.sellPriceCents / 100).toFixed(2)}
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      Current: {formatMoneyFromCents(row.sellPriceCents, row.currency)}
                    </div>
                  </td>

                  <td className="px-4 py-4">{row.sourceId}</td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => saveRow(row.offerId)}
                      disabled={loadingId === row.offerId}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {loadingId === row.offerId ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}