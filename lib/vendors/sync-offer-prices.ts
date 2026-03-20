import { prisma } from "@/lib/prisma";
import { calculateSellPrice } from "@/lib/pricing/calculate-sell-price";
import { candidatePassesHardFitment } from "./candidate-score";

type CandidateRow = {
  id: string;
  vendor: "amazon" | string;
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

type SyncOptions = {
  take?: number;
  make?: string;
  model?: string;
  partType?: string;
  onlyPending?: boolean;
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

function bestCandidateFromShortlist(candidates: CandidateRow[]) {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;

    const aPrice = a.priceCents ?? Number.POSITIVE_INFINITY;
    const bPrice = b.priceCents ?? Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  })[0];
}

export async function syncOfferPrices(options: SyncOptions = {}) {
  const { take, make, model, partType, onlyPending = true } = options;

  const offers = await prisma.offer.findMany({
    where: {
      ...(make
        ? {
            vehicle: {
              make: {
                name: {
                  equals: make,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(model
        ? {
            vehicle: {
              ...(make
                ? {
                    make: {
                      name: {
                        equals: make,
                        mode: "insensitive",
                      },
                    },
                  }
                : {}),
              model: {
                name: {
                  equals: model,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(partType
        ? {
            part: {
              partType: {
                name: {
                  equals: partType,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(onlyPending
        ? {
            OR: [{ syncStatus: "pending" }, { syncStatus: "failed" }],
          }
        : {}),
    },
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
    orderBy: {
      updatedAt: "desc",
    },
    ...(typeof take === "number" ? { take } : {}),
  });

  console.log("Preparing offer ids for sync with options:", {
    take,
    make,
    model,
    partType,
    onlyPending,
  });
  console.log("Syncing offer ids:", offers.map((o) => o.id));

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
    const amazonShortlist = shortlistTopThree(input, amazonCandidates);
    const selected = bestCandidateFromShortlist(amazonShortlist);

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
        amazonPriceCents: selected?.priceCents ?? null,
        aPremiumPriceCents: null,
        amazonUrl: selected?.productUrl ?? null,
        aPremiumUrl: null,
        referencePriceCents: selectedPriceCents,
        sellPriceCents: pricing?.sellPriceCents ?? 0,
        sourceId: selected ? "amazon" : "manual",
        syncStatus: selectedPriceCents !== null ? "success" : "failed",
        syncError:
          selectedPriceCents !== null
            ? null
            : "No strict-fit Amazon priced candidate found",
        lastPriceSyncAt: new Date(),
      },
    });

    console.log("Offer sync result:", {
      offerId: offer.id,
      partType: input.partType,
      candidatesCount: candidates.length,
      amazonCandidatesCount: amazonCandidates.length,
      selected: selected
        ? {
            vendor: selected.vendor,
            title: selected.title,
            priceCents: selected.priceCents,
            score: selected.score,
          }
        : null,
    });
  }

  console.log(`Offer price sync complete for ${offers.length} offer(s).`);
}