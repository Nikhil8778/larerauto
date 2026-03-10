import { headers } from "next/headers";
import AdminPartsTable from "./AdminPartsTable";
import SyncVendorsButton from "./SyncVendorsButton";
import AdminPartsToolbar from "./AdminPartsToolbar";

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

type SearchParams = {
  make?: string;
  model?: string;
  partType?: string;
  status?: string;
  inventory?: string;
};

export default async function AdminPartsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

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

  const selectedMake = sp.make ?? "";
  const selectedModel = sp.model ?? "";
  const selectedPartType = sp.partType ?? "";
  const selectedStatus = sp.status ?? "";
  const selectedInventory = sp.inventory ?? "";

  const makeOptions = [...new Set(rows.map((r) => r.make))].sort();
  const modelOptions = [...new Set(rows.map((r) => r.model))].sort();
  const partTypeOptions = [...new Set(rows.map((r) => r.partType))].sort();

  let filteredRows = rows.filter((row) => {
    if (selectedMake && row.make !== selectedMake) return false;
    if (selectedModel && row.model !== selectedModel) return false;
    if (selectedPartType && row.partType !== selectedPartType) return false;
    if (selectedStatus && row.syncStatus?.toLowerCase() !== selectedStatus.toLowerCase()) return false;

    if (selectedInventory === "low" && row.inventoryQty > 2) return false;
    if (selectedInventory === "out" && row.inventoryQty !== 0) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Parts</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Professional control panel for pricing, sync, fitment, and inventory.
            </p>
          </div>

          <SyncVendorsButton />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <AdminPartsToolbar
          makeOptions={makeOptions}
          modelOptions={modelOptions}
          partTypeOptions={partTypeOptions}
          selectedMake={selectedMake}
          selectedModel={selectedModel}
          selectedPartType={selectedPartType}
          selectedStatus={selectedStatus}
          selectedInventory={selectedInventory}
        />
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <AdminPartsTable rows={filteredRows} />
      </div>
    </div>
  );
}