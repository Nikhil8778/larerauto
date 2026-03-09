import { headers } from "next/headers";
import AdminPartsTable from "./AdminPartsTable";

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

export const dynamic = "force-dynamic";

export default async function AdminPartsPage() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";

  const url = new URL("/api/admin/parts", `${proto}://${host}`);
  const res = await fetch(url.toString(), { cache: "no-store" });

  let rows: AdminPartRow[] = [];

  if (res.ok) {
    const data = await res.json();
    rows = data.rows ?? [];
  }

  return (
    <div>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Parts</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          All sellable offers currently available in your database.
        </p>
      </div>

      <div className="mt-6">
        <AdminPartsTable rows={rows} />
      </div>
    </div>
  );
}