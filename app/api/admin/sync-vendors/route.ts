import { NextResponse } from "next/server";
import { syncAllVendorPrices } from "@/lib/vendor-sync";

export async function POST() {
  try {
    const result = await syncAllVendorPrices();
    return NextResponse.json(result);
  } catch (error) {
    console.error("sync vendors api error", error);
    return NextResponse.json(
      { success: false, error: "Vendor sync failed" },
      { status: 500 }
    );
  }
}