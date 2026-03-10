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

    let topCandidateId: string | null = null;
    const topCandidate = allCandidates[0] ?? null;

    for (const candidate of allCandidates) {
      const created = await prisma.vendorCandidate.create({
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

      if (
        topCandidate &&
        candidate.vendor === topCandidate.vendor &&
        candidate.title === topCandidate.title &&
        candidate.productUrl === topCandidate.productUrl
      ) {
        topCandidateId = created.id;
      }
    }

    if (topCandidate && topCandidateId && topCandidate.score >= 90) {
      await prisma.vendorCandidate.update({
        where: { id: topCandidateId },
        data: {
          selected: true,
        },
      });

      if (topCandidate.vendor === "amazon") {
        await prisma.offer.update({
          where: { id: offer.id },
          data: {
            amazonUrl: topCandidate.productUrl,
            amazonPriceCents: topCandidate.priceCents ?? null,
            referencePriceCents: topCandidate.priceCents ?? null,
            syncStatus: "success",
          },
        });
      }

      if (topCandidate.vendor === "apremium") {
        await prisma.offer.update({
          where: { id: offer.id },
          data: {
            aPremiumUrl: topCandidate.productUrl,
            aPremiumPriceCents: topCandidate.priceCents ?? null,
            referencePriceCents: topCandidate.priceCents ?? null,
            syncStatus: "success",
          },
        });
      }
    }
  }
}