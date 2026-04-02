import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateSellPrice } from "@/lib/pricing/calculate-sell-price";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ success: false, error: "Missing candidateId" }, { status: 400 });
    }

    const candidate = await prisma.vendorCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    if (candidate.vendor !== "amazon") {
      return NextResponse.json(
        { success: false, error: "Only Amazon candidates are supported in this flow." },
        { status: 400 }
      );
    }

    const offerId = candidate.offerId;
    const pricing = calculateSellPrice(candidate.priceCents ?? null);

    await prisma.vendorCandidate.updateMany({
      where: { offerId },
      data: { selected: false },
    });

    await prisma.vendorCandidate.update({
      where: { id: candidateId },
      data: { selected: true },
    });

    await prisma.offer.update({
      where: { id: offerId },
      data: {
        amazonUrl: candidate.productUrl,
        amazonPriceCents: candidate.priceCents ?? null,
        referencePriceCents: candidate.priceCents ?? null,
        sellPriceCents: pricing?.sellPriceCents ?? 0,
        sourceId: "amazon",
        syncStatus: candidate.priceCents ? "success" : "failed",
        syncError: candidate.priceCents ? null : "Selected candidate has no usable price",
        lastPriceSyncAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("select candidate error", error);
    return NextResponse.json(
      { success: false, error: "Failed to select candidate" },
      { status: 500 }
    );
  }
}