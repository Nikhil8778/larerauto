import { PrismaClient } from "@prisma/client";
import { fetchAmazonPrice } from "./vendors/amazon";
import { fetchAPremiumPrice } from "./vendors/apremium";
import { calculateWebsitePriceFromVendors } from "./vendor-pricing";

const prisma = new PrismaClient();

export async function syncAllVendorPrices() {
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
    orderBy: [
      { vehicle: { make: { name: "asc" } } },
      { vehicle: { model: { name: "asc" } } },
      { vehicle: { year: "desc" } },
    ],
  });

  const results: Array<{
    offerId: string;
    syncStatus: string | null;
    amazonPriceCents: number | null;
    aPremiumPriceCents: number | null;
    sellPriceCents: number;
  }> = [];

  for (const offer of offers) {
    const common = {
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      year: offer.vehicle.year,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType.name,
    };

    const amazon = await fetchAmazonPrice({
      ...common,
      url: offer.amazonUrl,
    });

    const aPremium = await fetchAPremiumPrice({
      ...common,
      url: offer.aPremiumUrl,
    });

    const pricing = calculateWebsitePriceFromVendors(
      amazon.priceCents,
      aPremium.priceCents
    );

    let syncStatus: string = "failed";
    let syncError: string | null =
      amazon.error || aPremium.error || "No vendor prices found";

    if (amazon.priceCents && aPremium.priceCents) {
      syncStatus = "success";
      syncError = null;
    } else if (amazon.priceCents || aPremium.priceCents) {
      syncStatus = "partial";
      syncError = amazon.error || aPremium.error || null;
    }

    const updated = await prisma.offer.update({
      where: { id: offer.id },
      data: {
        amazonPriceCents: amazon.priceCents,
        aPremiumPriceCents: aPremium.priceCents,
        amazonUrl: amazon.productUrl,
        aPremiumUrl: aPremium.productUrl,
        referencePriceCents:
          pricing.referencePriceCents ?? offer.referencePriceCents,
        sellPriceCents: pricing.sellPriceCents ?? offer.sellPriceCents,
        lastPriceSyncAt: new Date(),
        syncStatus,
        syncError,
      },
    });

    results.push({
      offerId: updated.id,
      syncStatus: updated.syncStatus,
      amazonPriceCents: updated.amazonPriceCents,
      aPremiumPriceCents: updated.aPremiumPriceCents,
      sellPriceCents: updated.sellPriceCents,
    });
  }

  return {
    count: results.length,
    results,
  };
}