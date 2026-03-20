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
  partType?: string;
  onlyUnsynced?: boolean;
};

export async function findAndStoreVendorCandidates(options: FindOptions = {}) {
  const {
    take,
    make,
    model,
    partType,
    onlyUnsynced = true,
  } = options;

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

    console.log("Searching Amazon candidates for:", input);
    console.log("Known reference numbers:", knownReferenceNumbers);

    const amazonCandidates = await searchAmazonCandidates(input);

    for (const candidate of amazonCandidates) {
      const reasons = explainCandidateFailure(input, candidate);

      console.log("Candidate review:", {
        vendor: candidate.vendor,
        title: candidate.title,
        priceCents: candidate.priceCents,
        reasons,
      });
    }

    const strictCandidates = amazonCandidates
      .filter((c) => candidatePassesHardFitment(input, c))
      .map((c) => ({
        ...c,
        score: scoreCandidate(input, c),
      }))
      .sort((a, b) => b.score - a.score);

    console.log(
      "Top scored candidates:",
      strictCandidates.slice(0, 5).map((c) => ({
        vendor: c.vendor,
        title: c.title,
        score: c.score,
        referenceNumbers: c.referenceNumbers,
        priceCents: c.priceCents,
      }))
    );

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
          rawText: candidate.rawText ?? null,
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