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

    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      referral: {
        id: result.referral.id,
        mechanicId: result.referral.mechanic.id,
        code: result.referral.code,
        mechanicShopName: result.referral.mechanic.shopName,
        customerDiscountPct: result.referral.customerDiscountPct,
        expiresAt: result.referral.expiresAt,
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