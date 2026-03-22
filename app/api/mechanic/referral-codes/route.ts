import { NextRequest, NextResponse } from "next/server";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { prisma } from "@/lib/prisma";
import { createReferralCodeForMechanic } from "@/lib/mechanic-referral";

export async function GET() {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const codes = await prisma.mechanicReferralCode.findMany({
      where: {
        mechanicId: mechanic.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      codes,
    });
  } catch (error) {
    console.error("GET /api/mechanic/referral-codes error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch referral codes." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    if (!mechanic.isApproved || !mechanic.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account is not eligible." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const usageLimit =
      typeof body.usageLimit === "number" && body.usageLimit > 0
        ? body.usageLimit
        : 1;

    const expiresDays =
      typeof body.expiresDays === "number" && body.expiresDays > 0
        ? body.expiresDays
        : 7;

    const created = await createReferralCodeForMechanic(mechanic.id);

    const updated = await prisma.mechanicReferralCode.update({
      where: { id: created.id },
      data: {
        usageLimit,
        expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      code: updated,
    });
  } catch (error) {
    console.error("POST /api/mechanic/referral-codes error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create referral code." },
      { status: 500 }
    );
  }
}