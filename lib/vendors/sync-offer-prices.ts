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
  engine?: string;
  year?: number;
  partType?: string;
  onlyPending?: boolean;
};

function isPreferredSupplierCandidate(candidate: CandidateRow) {
  const text = `${candidate.title ?? ""} ${candidate.rawText ?? ""}`.toLowerCase();
  return (
    text.includes("sellerstore=logel") ||
    text.includes("sellerstore=logels") ||
    text.includes("sellerstore=logel's") ||
    text.includes("preferredsupplier=true") ||
    text.includes("visit the logel") ||
    text.includes("logel's auto parts store") ||
    text.includes("logels auto parts store")
  );
}

function isUsable(input: OfferInput, candidate: CandidateRow) {
  return (
    candidate.priceCents !== null &&
    candidate.priceCents > 0 &&
    candidatePassesHardFitment(input, candidate)
  );
}

function shortlistTopThree(input: OfferInput, candidates: CandidateRow[]) {
  const usable = [...candidates].filter((c) => isUsable(input, c));
  const preferred = usable.filter(isPreferredSupplierCandidate);
  const pool = preferred.length > 0 ? preferred : usable;

  return pool.sort((a, b) => b.score - a.score).slice(0, 3);
}

function bestCandidateFromShortlist(candidates: CandidateRow[]) {
  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    const aPreferred = isPreferredSupplierCandidate(a) ? 1 : 0;
    const bPreferred = isPreferredSupplierCandidate(b) ? 1 : 0;
    if (bPreferred !== aPreferred) return bPreferred - aPreferred;

    if (a.score !== b.score) return b.score - a.score;

    const aPrice = a.priceCents ?? Number.POSITIVE_INFINITY;
    const bPrice = b.priceCents ?? Number.POSITIVE_INFINITY;
    return aPrice - bPrice;
  })[0];
}

async function propagateSelectedCandidateToCompatibleOffers(
  sourceOfferId: string,
  selected: CandidateRow,
  sourceInput: OfferInput
) {
  const selectedPriceCents = selected.priceCents;
  if (selectedPriceCents === null || selectedPriceCents <= 0) return 0;

  const relatedOffers = await prisma.offer.findMany({
    where: {
      id: {
        not: sourceOfferId,
      },
      part: {
        partType: {
          name: {
            equals: sourceInput.partType,
            mode: "insensitive",
          },
        },
      },
      OR: [
        { syncStatus: null },
        { syncStatus: "" },
        { syncStatus: "pending" },
        { syncStatus: "failed" },
        { sourceId: "manual" },
      ],
    },
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
    take: 300,
  });

  let updatedCount = 0;

  for (const offer of relatedOffers) {
    const targetInput: OfferInput = {
      year: offer.vehicle.year,
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType.name,
    };

    if (!candidatePassesHardFitment(targetInput, selected)) {
      continue;
    }

    const pricing = calculateSellPrice(selectedPriceCents);

    await prisma.vendorCandidate.deleteMany({
      where: {
        offerId: offer.id,
      },
    });

    await prisma.vendorCandidate.create({
      data: {
        offerId: offer.id,
        vendor: selected.vendor,
        title: selected.title,
        productUrl: selected.productUrl,
        priceCents: selectedPriceCents,
        badge: selected.badge ?? null,
        inStock: selected.inStock ?? null,
        score: selected.score,
        rawText: [
          selected.rawText ?? null,
          `propagatedFromOffer=${sourceOfferId}`,
        ]
          .filter(Boolean)
          .join(" || ")
          .slice(0, 3000),
        selected: true,
      },
    });

    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        amazonPriceCents: selectedPriceCents,
        aPremiumPriceCents: null,
        amazonUrl: selected.productUrl,
        aPremiumUrl: null,
        referencePriceCents: selectedPriceCents,
        sellPriceCents: pricing?.sellPriceCents ?? 0,
        sourceId: "amazon",
        syncStatus: "success",
        syncError: null,
        lastPriceSyncAt: new Date(),
      },
    });

    updatedCount += 1;

    console.log("Propagated selected candidate to compatible offer:", {
      sourceOfferId,
      targetOfferId: offer.id,
      year: targetInput.year,
      make: targetInput.make,
      model: targetInput.model,
      engine: targetInput.engine,
      partType: targetInput.partType,
      priceCents: selectedPriceCents,
    });
  }

  return updatedCount;
}

export async function syncOfferPrices(options: SyncOptions = {}) {
  const {
    take,
    make,
    model,
    engine,
    year,
    partType,
    onlyPending = true,
  } = options;

  const vehicleWhere: any = {};

  if (make) {
    vehicleWhere.make = {
      name: {
        equals: make,
        mode: "insensitive",
      },
    };
  }

  if (model) {
    vehicleWhere.model = {
      name: {
        equals: model,
        mode: "insensitive",
      },
    };
  }

  if (engine) {
    vehicleWhere.engine = {
      name: {
        equals: engine,
        mode: "insensitive",
      },
    };
  }

  if (typeof year === "number" && Number.isFinite(year)) {
    vehicleWhere.year = year;
  }

  const offers = await prisma.offer.findMany({
    where: {
      ...(Object.keys(vehicleWhere).length > 0 ? { vehicle: vehicleWhere } : {}),
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
    engine,
    year,
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

    const hasAnyAmazonCandidates = amazonCandidates.length > 0;
    const hasPricedAmazonCandidates = amazonCandidates.some(
      (c) => c.priceCents !== null && c.priceCents > 0
    );

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
            : !hasAnyAmazonCandidates
            ? "No Amazon candidates found"
            : !hasPricedAmazonCandidates
            ? "Amazon candidates found but no usable price parsed"
            : "Amazon candidates found, but none passed strict fitment validation",
        lastPriceSyncAt: new Date(),
      },
    });

    let propagatedCount = 0;

    if (selected) {
      propagatedCount = await propagateSelectedCandidateToCompatibleOffers(
        offer.id,
        selected,
        input
      );
    }

    console.log("Offer sync result:", {
      offerId: offer.id,
      year: input.year,
      make: input.make,
      model: input.model,
      engine: input.engine,
      partType: input.partType,
      candidatesCount: candidates.length,
      amazonCandidatesCount: amazonCandidates.length,
      preferredCandidatesCount: amazonCandidates.filter(isPreferredSupplierCandidate).length,
      propagatedCount,
      selected: selected
        ? {
            vendor: selected.vendor,
            title: selected.title,
            priceCents: selected.priceCents,
            score: selected.score,
            preferredSupplier: isPreferredSupplierCandidate(selected),
          }
        : null,
    });
  }

  console.log(`Offer price sync complete for ${offers.length} offer(s).`);
}