import { NextResponse } from "next/server";
import { syncAllVendorPrices } from "@/lib/vendor-sync";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const make = String(body?.make ?? "").trim();
    const model = String(body?.model ?? "").trim();
    const partType = String(body?.partType ?? "").trim();

    const takeRaw = Number(body?.take ?? 10);
    const take = Number.isFinite(takeRaw) ? takeRaw : 10;

    const onlyPending =
      typeof body?.onlyPending === "boolean" ? body.onlyPending : true;

    const result = await syncAllVendorPrices({
      make: make || undefined,
      model: model || undefined,
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