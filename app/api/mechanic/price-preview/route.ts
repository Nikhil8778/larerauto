import { NextRequest, NextResponse } from "next/server";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import { prisma } from "@/lib/prisma";
import { applyMechanicDiscount } from "@/lib/mechanic-pricing";

export async function POST(request: NextRequest) {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const offerId = String(body.offerId || "");

    if (!offerId) {
      return NextResponse.json(
        { success: false, message: "Offer ID is required." },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        sellPriceCents: true,
        currency: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, message: "Offer not found." },
        { status: 404 }
      );
    }

    const pricing = applyMechanicDiscount(
      offer.sellPriceCents,
      mechanic.tradeDiscountPct
    );

    return NextResponse.json({
      success: true,
      pricing: {
        offerId: offer.id,
        currency: offer.currency,
        ...pricing,
      },
    });
  } catch (error) {
    console.error("POST /api/mechanic/price-preview error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to preview mechanic price." },
      { status: 500 }
    );
  }
}