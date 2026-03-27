import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("POST /api/quotes body:", body);
    const year = Number(body.year || 0);
    const make = String(body.make || "").trim();
    const model = String(body.model || "").trim();
    const engine = String(body.engine || "").trim();
    const partType = String(body.partType || "").trim();
    const vinRaw = String(body.vin || "").trim();
    const vin = vinRaw || null;

    const bestOfferIdRaw = String(body.bestOfferId || "").trim();
    const bestOfferId = bestOfferIdRaw || null;

    const itemPriceCents = Number(body.itemPriceCents || 0);

    const utmSourceRaw = String(body.utmSource || "").trim();
    const utmMediumRaw = String(body.utmMedium || "").trim();
    const utmCampaignRaw = String(body.utmCampaign || "").trim();
    const sourceChannelRaw = String(body.sourceChannel || "").trim();

    const utmSource = utmSourceRaw || null;
    const utmMedium = utmMediumRaw || null;
    const utmCampaign = utmCampaignRaw || null;
    const sourceChannel = sourceChannelRaw || null;

    if (!year || !make || !model || !engine || !partType) {
      return NextResponse.json(
        { error: "Missing required quote fields." },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.create({
      data: {
        year,
        make,
        model,
        engine,
        partType,
        vin,
        bestOfferId,
        itemPriceCents,
        utmSource,
        utmMedium,
        utmCampaign,
        sourceChannel,
      },
    });

    return NextResponse.json({
      ok: true,
      quoteId: quote.id,
    });
  } catch (error) {
    console.error("POST /api/quotes error:", error);
    return NextResponse.json(
      { error: "Failed to save quote." },
      { status: 500 }
    );
  }
}