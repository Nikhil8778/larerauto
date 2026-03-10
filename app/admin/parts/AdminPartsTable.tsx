"use client";

import { useMemo, useState } from "react";

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
  amazonPriceCents: number | null;
  aPremiumPriceCents: number | null;
  amazonUrl: string;
  aPremiumUrl: string;
  syncStatus: string;
  lastPriceSyncAt: string;
  currency: string;
  sourceId: string;
};

function moneyFromCents(cents: number | null) {
  if (cents === null) return "-";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-CA");
}

function statusBadge(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "success") return "bg-emerald-100 text-emerald-700";
  if (normalized === "partial") return "bg-amber-100 text-amber-700";
  if (normalized === "failed") return "bg-rose-100 text-rose-700";

  return "bg-slate-100 text-slate-700";
}

export default function AdminPartsTable({
  rows,
}: {
  rows: AdminPartRow[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const stickyBase =
    "sticky z-10 bg-white border-r border-slate-200 shadow-[1px_0_0_0_rgba(226,232,240,1)]";

  async function saveRow(offerId: string) {
    const inventoryInput = document.getElementById(
      `inventory-${offerId}`
    ) as HTMLInputElement | null;
    const sellInput = document.getElementById(
      `sell-${offerId}`
    ) as HTMLInputElement | null;
    const amazonUrlInput = document.getElementById(
      `amazon-url-${offerId}`
    ) as HTMLTextAreaElement | null;
    const aPremiumUrlInput = document.getElementById(
      `apremium-url-${offerId}`
    ) as HTMLTextAreaElement | null;

    if (!inventoryInput || !sellInput || !amazonUrlInput || !aPremiumUrlInput) {
      alert("Could not read input values.");
      return;
    }

    const inventoryQty = Number(inventoryInput.value);
    const sellPriceCents = Math.round(Number(sellInput.value || "0") * 100);
    const amazonUrl = amazonUrlInput.value.trim();
    const aPremiumUrl = aPremiumUrlInput.value.trim();

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
          amazonUrl,
          aPremiumUrl,
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

  const totals = useMemo(() => {
    const failed = rows.filter((r) => r.syncStatus?.toLowerCase() === "failed").length;
    const partial = rows.filter((r) => r.syncStatus?.toLowerCase() === "partial").length;
    const success = rows.filter((r) => r.syncStatus?.toLowerCase() === "success").length;
    return { failed, partial, success };
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
        No rows found.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 text-xs font-bold">
        <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
          Total: {rows.length}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-700">
          Success: {totals.success}
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-700">
          Partial: {totals.partial}
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-2 text-rose-700">
          Failed: {totals.failed}
        </span>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[2200px] text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200 text-left text-slate-700">
              <th className={`px-3 py-3 ${stickyBase}`} style={{ left: 0, minWidth: 110 }}>
                Make
              </th>
              <th className={`px-3 py-3 ${stickyBase}`} style={{ left: 110, minWidth: 110 }}>
                Model
              </th>
              <th className={`px-3 py-3 ${stickyBase}`} style={{ left: 220, minWidth: 110 }}>
                Engine
              </th>
              <th className={`px-3 py-3 ${stickyBase}`} style={{ left: 330, minWidth: 80 }}>
                Year
              </th>
              <th className={`px-3 py-3 ${stickyBase}`} style={{ left: 410, minWidth: 130 }}>
                Part Type
              </th>

              <th className="px-3 py-3 min-w-[180px]">Title</th>
              <th className="px-3 py-3 min-w-[100px]">Inventory</th>
              <th className="px-3 py-3 min-w-[250px]">Amazon</th>
              <th className="px-3 py-3 min-w-[250px]">A-Premium</th>
              <th className="px-3 py-3 min-w-[120px]">Amazon Price</th>
              <th className="px-3 py-3 min-w-[130px]">A-Premium Price</th>
              <th className="px-3 py-3 min-w-[130px]">Sell Price</th>
              <th className="px-3 py-3 min-w-[120px]">Sync Status</th>
              <th className="px-3 py-3 min-w-[170px]">Last Sync</th>
              <th className="px-3 py-3 min-w-[100px]">Source</th>
              <th className="px-3 py-3 min-w-[100px]">Action</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {rows.map((row) => (
              <tr
                key={row.offerId}
                className="border-b border-slate-100 align-top hover:bg-slate-50/50"
              >
                <td
                  className={`${stickyBase} px-3 py-3 font-semibold text-slate-900`}
                  style={{ left: 0, minWidth: 110 }}
                >
                  {row.make}
                </td>
                <td
                  className={`${stickyBase} px-3 py-3`}
                  style={{ left: 110, minWidth: 110 }}
                >
                  {row.model}
                </td>
                <td
                  className={`${stickyBase} px-3 py-3`}
                  style={{ left: 220, minWidth: 110 }}
                >
                  {row.engine}
                </td>
                <td
                  className={`${stickyBase} px-3 py-3`}
                  style={{ left: 330, minWidth: 80 }}
                >
                  {row.year}
                </td>
                <td
                  className={`${stickyBase} px-3 py-3`}
                  style={{ left: 410, minWidth: 130 }}
                >
                  {row.partType}
                </td>

                <td className="px-3 py-3">{row.title}</td>

                <td className="px-3 py-3">
                  <input
                    id={`inventory-${row.offerId}`}
                    defaultValue={row.inventoryQty}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                  />
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {row.amazonUrl ? (
                      <a
                        href={row.amazonUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                      >
                        Amazon 🔗
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No link</span>
                    )}
                  </div>

                  <textarea
                    id={`amazon-url-${row.offerId}`}
                    defaultValue={row.amazonUrl}
                    className="mt-2 w-[220px] rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    rows={3}
                  />
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {row.aPremiumUrl ? (
                      <a
                        href={row.aPremiumUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                      >
                        A-Premium 🔗
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No link</span>
                    )}
                  </div>

                  <textarea
                    id={`apremium-url-${row.offerId}`}
                    defaultValue={row.aPremiumUrl}
                    className="mt-2 w-[220px] rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    rows={3}
                  />
                </td>

                <td className="px-3 py-3 font-medium">
                  {moneyFromCents(row.amazonPriceCents)}
                </td>

                <td className="px-3 py-3 font-medium">
                  {moneyFromCents(row.aPremiumPriceCents)}
                </td>

                <td className="px-3 py-3">
                  <input
                    id={`sell-${row.offerId}`}
                    defaultValue={(row.sellPriceCents / 100).toFixed(2)}
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    Current: {moneyFromCents(row.sellPriceCents)}
                  </div>
                </td>

                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadge(
                      row.syncStatus || ""
                    )}`}
                  >
                    {row.syncStatus || "-"}
                  </span>
                </td>

                <td className="px-3 py-3 text-xs text-slate-600">
                  {formatDateTime(row.lastPriceSyncAt)}
                </td>

                <td className="px-3 py-3">{row.sourceId}</td>

                <td className="px-3 py-3">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}