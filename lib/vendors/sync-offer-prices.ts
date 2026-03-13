import { prisma } from "@/lib/prisma";
import { calculateSellPrice } from "@/lib/pricing/calculate-sell-price";
import { candidatePassesHardFitment } from "./candidate-score";

type CandidateRow = {
  id: string;
  vendor: string;
  title: string;
  productUrl: string;
  priceCents: number | null;
  score: number;
  selected: boolean;
  rawText?: string | null;
  inStock?: boolean | null;
  badge?: string | null;
};

type OfferInput = {
  year: number;
  make: string;
  model: string;
  engine: string;
  partType: string;
};

function isUsable(input: OfferInput, candidate: CandidateRow) {
  return (
    candidate.priceCents !== null &&
    candidate.priceCents > 0 &&
    candidatePassesHardFitment(input, candidate)
  );
}

function shortlistTopThree(input: OfferInput, candidates: CandidateRow[]) {
  return [...candidates]
    .filter((c) => isUsable(input, c))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function cheapestAmongShortlist(candidates: CandidateRow[]) {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    const aPrice = a.priceCents ?? Number.POSITIVE_INFINITY;
    const bPrice = b.priceCents ?? Number.POSITIVE_INFINITY;

    if (aPrice !== bPrice) return aPrice - bPrice;
    return b.score - a.score;
  })[0];
}

function bestVendorDisplayPrice(input: OfferInput, candidates: CandidateRow[]) {
  const shortlist = shortlistTopThree(input, candidates);
  return cheapestAmongShortlist(shortlist);
}

export async function syncOfferPrices() {
  const offers = await prisma.offer.findMany({
    include: {
      candidates: true,
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
  });

  for (const offer of offers) {
    const candidates = (offer.candidates ?? []) as CandidateRow[];

    const input: OfferInput = {
      year: offer.vehicle.year,
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType.name,
    };

    await prisma.vendorCandidate.updateMany({
      where: { offerId: offer.id },
      data: { selected: false },
    });

    const amazonCandidates = candidates.filter((c) => c.vendor === "amazon");
    const apremiumCandidates = candidates.filter((c) => c.vendor === "apremium");

    const amazonBest = bestVendorDisplayPrice(input, amazonCandidates);
    const apremiumBest = bestVendorDisplayPrice(input, apremiumCandidates);

    const selected = cheapestAmongShortlist(
      [amazonBest, apremiumBest].filter((x): x is CandidateRow => x !== null)
    );

    if (selected) {
      await prisma.vendorCandidate.update({
        where: { id: selected.id },
        data: { selected: true },
      });
    }

    const selectedPriceCents = selected?.priceCents ?? null;
    const pricing =
      selectedPriceCents !== null
        ? calculateSellPrice(selectedPriceCents)
        : null;

    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        amazonPriceCents: amazonBest?.priceCents ?? null,
        aPremiumPriceCents: apremiumBest?.priceCents ?? null,
        amazonUrl: amazonBest?.productUrl ?? null,
        aPremiumUrl: apremiumBest?.productUrl ?? null,
        referencePriceCents: selectedPriceCents,
        sellPriceCents: pricing?.sellPriceCents ?? 0,
        sourceId: selected?.vendor ?? "manual",
        syncStatus: selectedPriceCents !== null ? "success" : "failed",
        syncError:
          selectedPriceCents !== null
            ? null
            : "No valid priced candidate after hard fitment filtering",
        lastPriceSyncAt: new Date(),
      },
    });

    console.log("Offer sync result:", {
      offerId: offer.id,
      partType: input.partType,
      candidatesCount: candidates.length,
      amazonCandidatesCount: amazonCandidates.length,
      apremiumCandidatesCount: apremiumCandidates.length,
      amazonBest: amazonBest
        ? {
            title: amazonBest.title,
            priceCents: amazonBest.priceCents,
          }
        : null,
      apremiumBest: apremiumBest
        ? {
            title: apremiumBest.title,
            priceCents: apremiumBest.priceCents,
          }
        : null,
      selected: selected
        ? {
            vendor: selected.vendor,
            title: selected.title,
            priceCents: selected.priceCents,
          }
        : null,
    });
  }
}