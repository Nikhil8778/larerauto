import { PrismaClient } from "@prisma/client";
import { fetchAmazonPrice } from "../lib/vendors/amazon";
import { fetchAPremiumPrice } from "../lib/vendors/apremium";
import { calculateWebsitePriceFromVendors } from "../lib/vendor-pricing";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting vendor price sync...");

  const offers = await prisma.offer.findMany({
    include: {
      vehicle: {
        include: {
          make: true,
          model: true,
          engine: true,
        },
      },
      part: true,
    },
    orderBy: [
      { vehicle: { make: { name: "asc" } } },
      { vehicle: { model: { name: "asc" } } },
      { vehicle: { year: "desc" } },
    ],
  });

  console.log(`Found ${offers.length} offer(s) to sync.`);

  for (const offer of offers) {
    const input = {
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      year: offer.vehicle.year,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType,
    };

    console.log(
      `\nSyncing: ${input.year} ${input.make} ${input.model} ${input.engine} / ${input.partType}`
    );

    const amazon = await fetchAmazonPrice(input);
    const aPremium = await fetchAPremiumPrice(input);

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

    console.log("Updated offer:", {
      offerId: updated.id,
      amazonPriceCents: updated.amazonPriceCents,
      aPremiumPriceCents: updated.aPremiumPriceCents,
      referencePriceCents: updated.referencePriceCents,
      sellPriceCents: updated.sellPriceCents,
      syncStatus: updated.syncStatus,
    });
  }

  console.log("\nVendor price sync completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Vendor price sync failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });