import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const offers = await prisma.offer.findMany({
  include: {
    vehicle: {
      include: {
        make: true,
        model: true,
        engine: true,
      },
    },
    part: {
      include: {
        partType: true,
      },
    },
  },
  orderBy: {
    updatedAt: "desc",
  },
});

  const rows = offers.map((offer) => {
    let selectedPriceCents: number | null = null;

    if (offer.sourceId === "amazon") {
      selectedPriceCents = offer.amazonPriceCents;
    } else if (offer.sourceId === "apremium") {
      selectedPriceCents = offer.aPremiumPriceCents;
    }

    return {
      offerId: offer.id,
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      engine: offer.vehicle.engine.name,
      year: offer.vehicle.year,
      partType: offer.part.partType.name,
      title: offer.part.title,
      inventoryQty: offer.inventoryQty,
      sourceId: offer.sourceId,
      currency: offer.currency,

      amazonPriceCents: offer.amazonPriceCents,
      aPremiumPriceCents: offer.aPremiumPriceCents,
      selectedPriceCents,
      sellPriceCents: offer.sellPriceCents,

      amazonUrl: offer.amazonUrl ?? "",
      aPremiumUrl: offer.aPremiumUrl ?? "",

      syncStatus: offer.syncStatus ?? "",
      syncError: offer.syncError ?? "",
      lastPriceSyncAt: offer.lastPriceSyncAt
        ? offer.lastPriceSyncAt.toISOString()
        : "",
    };
  });

  return NextResponse.json({ rows });
}