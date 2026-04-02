"use client";

import { useState } from "react";

type Candidate = {
  id: string;
  vendor: string;
  title: string;
  productUrl: string;
  priceCents: number | null;
  score: number;
  selected: boolean;
  badge?: string | null;
  inStock?: boolean | null;
  rawText?: string | null;
};

type Row = {
  id: string;
  offerId: string;
  make: string;
  model: string;
  engine: string;
  year: number;
  partType: string;
  title?: string;
  syncStatus?: string | null;
  syncError?: string | null;
  selectedPriceCents?: number | null;
  sellPriceCents?: number | null;
  amazonUrl?: string | null;
  candidates: Candidate[];
};

function formatMoney(cents: number | null) {
  if (cents === null || cents === undefined) return "-";

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function statusBadge(status: string | null | undefined) {
  const value = String(status || "").toLowerCase();

  if (value === "success") {
    return (
      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
        success
      </span>
    );
  }

  if (value === "pending") {
    return (
      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
        pending
      </span>
    );
  }

  if (value === "failed") {
    return (
      <span className="rounded bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
        failed
      </span>
    );
  }

  return (
    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
      -
    </span>
  );
}

export default function CandidateTable({ rows }: { rows: Row[] }) {
  const [loadingId, setLoadingId] = useState("");

  async function selectCandidate(candidateId: string) {
    setLoadingId(candidateId);

    try {
      const res = await fetch("/api/admin/select-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to select candidate.");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while selecting candidate.");
    } finally {
      setLoadingId("");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-600 shadow-sm">
        No candidate rows found for the selected filters.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {rows.map((row) => (
        <div
          key={row.offerId}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {row.year} {row.make} {row.model} {row.engine} — {row.partType}
              </h2>
              <div className="mt-1 text-sm font-medium text-slate-600">
                {row.title || "No part title"}
              </div>
            </div>

            <div className="space-y-2 text-right">
              <div>{statusBadge(row.syncStatus)}</div>
              <div className="text-xs text-slate-500">
                Selected Price: {formatMoney(row.selectedPriceCents ?? null)}
              </div>
              <div className="text-xs text-slate-500">
                Sell Price: {formatMoney(row.sellPriceCents ?? null)}
              </div>
            </div>
          </div>

          {row.syncError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {row.syncError}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-700">
                  <th className="py-2 pr-4 font-semibold">Vendor</th>
                  <th className="px-2 py-2 font-semibold">Title</th>
                  <th className="px-2 py-2 font-semibold">Price</th>
                  <th className="px-2 py-2 font-semibold">Score</th>
                  <th className="px-2 py-2 font-semibold">Stock</th>
                  <th className="px-2 py-2 font-semibold">Badge</th>
                  <th className="px-2 py-2 font-semibold">Open</th>
                  <th className="px-2 py-2 font-semibold">Select</th>
                </tr>
              </thead>

              <tbody>
                {row.candidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-6 text-center text-slate-500">
                      No vendor candidates found for this offer.
                    </td>
                  </tr>
                ) : (
                  row.candidates.map((c) => (
                    <tr key={c.id} className="border-b align-top">
                      <td className="py-3 pr-4 capitalize text-slate-800">{c.vendor}</td>

                      <td className="px-2 py-3 text-slate-800">
                        <div className="max-w-[720px] whitespace-normal break-words">
                          {c.title}
                        </div>
                        {c.rawText ? (
                          <div className="mt-2 max-w-[720px] whitespace-normal break-words text-xs text-slate-500">
                            {c.rawText.slice(0, 280)}
                            {c.rawText.length > 280 ? "..." : ""}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-2 py-3 font-semibold text-slate-900">
                        {formatMoney(c.priceCents)}
                      </td>

                      <td className="px-2 py-3 text-slate-800">{c.score}</td>

                      <td className="px-2 py-3 text-slate-800">
                        {c.inStock === true
                          ? "In stock"
                          : c.inStock === false
                          ? "Out of stock"
                          : "-"}
                      </td>

                      <td className="px-2 py-3 text-slate-800">{c.badge || "-"}</td>

                      <td className="px-2 py-3">
                        <button
                          type="button"
                          className="text-blue-600 underline"
                          onClick={() => {
                            window.open(c.productUrl, "_blank", "noopener,noreferrer");
                          }}
                        >
                          Open
                        </button>
                      </td>

                      <td className="px-2 py-3">
                        {c.selected ? (
                          <span className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                            Selected
                          </span>
                        ) : (
                          <button
                            className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
                            disabled={loadingId === c.id}
                            onClick={() => selectCandidate(c.id)}
                          >
                            {loadingId === c.id ? "Saving..." : "Select"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}