import { NextResponse } from "next/server";
import { syncAllVendorPrices } from "@/lib/vendor-sync";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const make = String(body?.make ?? "").trim();
    const model = String(body?.model ?? "").trim();
    const engine = String(body?.engine ?? "").trim();
    const yearRaw = String(body?.year ?? "").trim();
    const partType = String(body?.partType ?? "").trim();

    const batchRaw = Number(body?.batch ?? 10);
    const take = Number.isFinite(batchRaw) ? batchRaw : 10;

    const syncScope = String(body?.syncScope ?? "pending").trim().toLowerCase();
    const onlyPending = syncScope !== "all";

    const year = yearRaw ? Number(yearRaw) : undefined;

    const result = await syncAllVendorPrices({
      make: make || undefined,
      model: model || undefined,
      engine: engine || undefined,
      year: Number.isFinite(year ?? NaN) ? year : undefined,
      partType: partType || undefined,
      take,
      onlyPending,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("sync vendors api error", error);
    return NextResponse.json(
      { success: false, error: "Vendor sync failed" },
      { status: 500 }
    );
  }
}