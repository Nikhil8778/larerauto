import { NextRequest, NextResponse } from "next/server";
import { validateReferralCode } from "@/lib/mechanic-referral";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Referral code is required." },
        { status: 400 }
      );
    }

    const result = await validateReferralCode(code);

    if (!result.valid || !result.referral) {
      return NextResponse.json(
        { success: false, message: result.message || "Invalid referral code." },
        { status: 404 }
      );
    }

    const referral = result.referral;

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        mechanicId: referral.mechanic.id,
        code: referral.code,
        mechanicShopName: referral.mechanic.shopName,
        customerDiscountPct: referral.customerDiscountPct,
        expiresAt: referral.expiresAt,
      },
    });
  } catch (error) {
    console.error("POST /api/referral/validate error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to validate referral code." },
      { status: 500 }
    );
  }
}