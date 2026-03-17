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
  selectedPriceCents: number | null;
  amazonUrl: string;
  aPremiumUrl: string;
  syncStatus: string;
  syncError: string;
  lastPriceSyncAt: string;
  currency: string;
  sourceId: string;
};

type SearchParams = {
  make?: string;
  model?: string;
  partType?: string;
  status?: string;
  inventory?: string;
};

type PartsApiResponse = {
  rows: AdminPartRow[];
  makeOptions: string[];
  modelOptions: string[];
  partTypeOptions: string[];
};

export const dynamic = "force-dynamic";

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

  if (sp.make) url.searchParams.set("make", sp.make);
  if (sp.model) url.searchParams.set("model", sp.model);
  if (sp.partType) url.searchParams.set("partType", sp.partType);
  if (sp.status) url.searchParams.set("status", sp.status);
  if (sp.inventory) url.searchParams.set("inventory", sp.inventory);

  const res = await fetch(url.toString(), { cache: "no-store" });

  let rows: AdminPartRow[] = [];
  let makeOptions: string[] = [];
  let modelOptions: string[] = [];
  let partTypeOptions: string[] = [];

  if (res.ok) {
    const data: PartsApiResponse = await res.json();
    rows = data.rows ?? [];
    makeOptions = data.makeOptions ?? [];
    modelOptions = data.modelOptions ?? [];
    partTypeOptions = data.partTypeOptions ?? [];
  }

  const selectedMake = sp.make ?? "";
  const selectedModel = sp.model ?? "";
  const selectedPartType = sp.partType ?? "";
  const selectedStatus = sp.status ?? "";
  const selectedInventory = sp.inventory ?? "";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Parts</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Professional control panel for pricing, sync, fitment, and inventory.
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Showing up to 100 most recently updated offers.
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
        <AdminPartsTable rows={rows} />
      </div>
    </div>
  );
}