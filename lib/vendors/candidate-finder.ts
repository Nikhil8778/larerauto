import { prisma } from "@/lib/prisma";
import { searchAmazonCandidates } from "./amazon-search";
import { searchAPremiumCandidates } from "./apremium-search";
import { scoreCandidate } from "./candidate-score";

export async function findAndStoreVendorCandidates() {
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
  });

  for (const offer of offers) {
    const input = {
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      year: offer.vehicle.year,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType,
    };

    console.log("Searching candidates for:", input);

    const amazonCandidates = await searchAmazonCandidates(input);
    const aPremiumCandidates = await searchAPremiumCandidates(input);

    const allCandidates = [...amazonCandidates, ...aPremiumCandidates]
      .map((c) => ({
        ...c,
        score: scoreCandidate(input, c),
      }))
      .sort((a, b) => b.score - a.score);

    await prisma.vendorCandidate.deleteMany({
      where: { offerId: offer.id },
    });

    for (const candidate of allCandidates) {
      await prisma.vendorCandidate.create({
        data: {
          offerId: offer.id,
          vendor: candidate.vendor,
          title: candidate.title,
          productUrl: candidate.productUrl,
          priceCents: candidate.priceCents,
          badge: candidate.badge ?? null,
          inStock: candidate.inStock ?? null,
          score: candidate.score,
          rawText: candidate.rawText ?? null,
          selected: false,
        },
      });
    }

    // Reset offer-side vendor fields here.
    // Actual selection will be done ONLY by sync-offer-prices.ts
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        amazonUrl: null,
        amazonPriceCents: null,
        aPremiumUrl: null,
        aPremiumPriceCents: null,
        referencePriceCents: null,
        syncStatus: "pending",
        syncError: null,
      },
    });
  }
}