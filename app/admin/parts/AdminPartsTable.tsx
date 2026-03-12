"use client";

type Row = {
  offerId: string;
  make: string;
  model: string;
  engine: string;
  year: number;
  partType: string;
  title: string;
  inventoryQty: number;
  sourceId: string;
  currency: string;

  amazonPriceCents: number | null;
  aPremiumPriceCents: number | null;
  selectedPriceCents: number | null;
  sellPriceCents: number;

  amazonUrl: string;
  aPremiumUrl: string;

  syncStatus: string;
  syncError: string;
  lastPriceSyncAt: string;
};

function formatMoney(cents: number | null, currency = "CAD") {
  if (cents === null) return "-";

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(value: string) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-CA");
}

function statusBadge(status: string) {
  const s = status.toLowerCase();

  if (s === "success") {
    return (
      <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
        success
      </span>
    );
  }

  if (s === "partial") {
    return (
      <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
        partial
      </span>
    );
  }

  if (s === "failed") {
    return (
      <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
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

export default function AdminPartsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Make</th>
            <th className="px-4 py-3 font-semibold">Model</th>
            <th className="px-4 py-3 font-semibold">Engine</th>
            <th className="px-4 py-3 font-semibold">Year</th>
            <th className="px-4 py-3 font-semibold">Part Type</th>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Amazon Price</th>
            <th className="px-4 py-3 font-semibold">A-Premium Price</th>
            <th className="px-4 py-3 font-semibold">Selected Price</th>
            <th className="px-4 py-3 font-semibold">Sell Price</th>
            <th className="px-4 py-3 font-semibold">Chosen Vendor</th>
            <th className="px-4 py-3 font-semibold">Sync Status</th>
            <th className="px-4 py-3 font-semibold">Last Sync</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.offerId} className="border-t align-top">
              <td className="px-4 py-3">{row.make}</td>
              <td className="px-4 py-3">{row.model}</td>
              <td className="px-4 py-3">{row.engine}</td>
              <td className="px-4 py-3">{row.year}</td>
              <td className="px-4 py-3">{row.partType}</td>
              <td className="px-4 py-3">
                <div className="max-w-[260px] break-words">{row.title}</div>
              </td>

              <td className="px-4 py-3">
                {row.amazonUrl ? (
                  <a
                    href={row.amazonUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    {formatMoney(row.amazonPriceCents, row.currency)}
                  </a>
                ) : (
                  formatMoney(row.amazonPriceCents, row.currency)
                )}
              </td>

              <td className="px-4 py-3">
                {row.aPremiumUrl ? (
                  <a
                    href={row.aPremiumUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    {formatMoney(row.aPremiumPriceCents, row.currency)}
                  </a>
                ) : (
                  formatMoney(row.aPremiumPriceCents, row.currency)
                )}
              </td>

              <td className="px-4 py-3 font-semibold text-slate-900">
                {formatMoney(row.selectedPriceCents, row.currency)}
              </td>

              <td className="px-4 py-3 font-semibold text-slate-900">
                {formatMoney(row.sellPriceCents, row.currency)}
              </td>

              <td className="px-4 py-3 capitalize">{row.sourceId}</td>

              <td className="px-4 py-3">
                <div>{statusBadge(row.syncStatus)}</div>
                {row.syncError ? (
                  <div className="mt-1 max-w-[200px] break-words text-xs text-red-600">
                    {row.syncError}
                  </div>
                ) : null}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                {formatDate(row.lastPriceSyncAt)}
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={13} className="px-4 py-6 text-center text-slate-500">
                No offers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}