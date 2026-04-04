import { prisma } from "@/lib/prisma";
import { searchAmazonCandidates } from "./amazon-search";
import {
  candidatePassesHardFitment,
  explainCandidateFailure,
  scoreCandidate,
} from "./candidate-score";

function normalizeRef(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function extractKnownReferenceNumbers(text: string) {
  const matches =
    text.match(
      /\b[A-Z0-9]{2,6}-[A-Z0-9]{2,6}-?[A-Z0-9]{0,6}\b|\b[A-Z]{1,4}\d{4,8}[A-Z]?\b|\b\d{5}-\d{5}\b|\b\d{5,10}[A-Z]?\b/gi
    ) ?? [];

  const cleaned = matches
    .map((m) => normalizeRef(m))
    .filter((m) => {
      if (m.length < 5) return false;
      if (!/\d/.test(m)) return false;
      if (/^(19|20)\d{2}$/.test(m)) return false;
      if (/^(19|20)\d{6}$/.test(m)) return false;
      if (/^(19|20)\d{2}(19|20)\d{2}$/.test(m)) return false;
      return true;
    });

  return [...new Set(cleaned)];
}

type FindOptions = {
  take?: number;
  make?: string;
  model?: string;
  engine?: string;
  year?: number;
  partType?: string;
  onlyUnsynced?: boolean;
};

export async function findAndStoreVendorCandidates(options: FindOptions = {}) {
  const {
    take,
    make,
    model,
    engine,
    year,
    partType,
    onlyUnsynced = true,
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
      ...(onlyUnsynced
        ? {
            OR: [
              { syncStatus: null },
              { syncStatus: "" },
              { syncStatus: "pending" },
              { syncStatus: "failed" },
            ],
          }
        : {}),
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
    orderBy: {
      updatedAt: "desc",
    },
    ...(typeof take === "number" ? { take } : {}),
  });

  console.log("Processing", offers.length, "offer(s)...");
  console.log("Candidate finder filters:", {
    take,
    make,
    model,
    engine,
    year,
    partType,
    onlyUnsynced,
  });

  for (const offer of offers) {
    const knownReferenceNumbers = extractKnownReferenceNumbers(
      `${offer.sourceId ?? ""} ${offer.sourceSku ?? ""} ${offer.part.title ?? ""}`
    );

    const input = {
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      year: offer.vehicle.year,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType.name,
      referenceNumbers: knownReferenceNumbers,
    };

    const amazonCandidates = await searchAmazonCandidates(input);

    const strictCandidates = amazonCandidates
      .filter((c) => candidatePassesHardFitment(input, c))
      .map((c) => ({
        ...c,
        score: scoreCandidate(input, c),
        reasons: explainCandidateFailure(input, c),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    await prisma.vendorCandidate.deleteMany({
      where: { offerId: offer.id },
    });

    for (const candidate of strictCandidates) {
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
          rawText: [
            candidate.rawText ?? null,
            candidate.reasons.length ? `reasons=${candidate.reasons.join("|")}` : null,
          ]
            .filter(Boolean)
            .join(" || ")
            .slice(0, 3000),
          selected: false,
        },
      });
    }

    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        amazonUrl: null,
        amazonPriceCents: null,
        aPremiumUrl: null,
        aPremiumPriceCents: null,
        referencePriceCents: null,
        syncStatus: strictCandidates.length > 0 ? "pending" : "failed",
        syncError:
          strictCandidates.length > 0
            ? null
            : "No strict-fit Amazon candidates found",
      },
    });
  }
}