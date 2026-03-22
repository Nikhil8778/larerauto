import { NextResponse } from "next/server";
import { getCurrentMechanic } from "@/lib/mechanic-auth";

export async function GET() {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      mechanic: {
        id: mechanic.id,
        shopName: mechanic.shopName,
        contactName: mechanic.contactName,
        email: mechanic.email,
        tradeDiscountPct: mechanic.tradeDiscountPct,
        referralDiscountPct: mechanic.referralDiscountPct,
        isApproved: mechanic.isApproved,
      },
    });
  } catch (error) {
    console.error("GET /api/mechanic/me error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch mechanic profile." },
      { status: 500 }
    );
  }
}