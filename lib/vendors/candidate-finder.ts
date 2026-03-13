import { prisma } from "@/lib/prisma";
import { searchAmazonCandidates } from "./amazon-search";
import { searchAPremiumCandidates } from "./apremium-search";
import { candidatePassesHardFitment, scoreCandidate } from "./candidate-score";

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
      part: {
        include: {
          partType: true,
        },
      },
    },
  });

  for (const offer of offers) {
    const knownReferenceNumbers = extractKnownReferenceNumbers(
      `${offer.sourceId ?? ""}`
    );

    const input = {
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      year: offer.vehicle.year,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType.name,
      referenceNumbers: knownReferenceNumbers,
    };

    console.log("Searching candidates for:", input);
    console.log("Known reference numbers:", knownReferenceNumbers);

    const amazonCandidates = await searchAmazonCandidates(input);
    const aPremiumCandidates = await searchAPremiumCandidates(input);

    const allCandidates = [...amazonCandidates, ...aPremiumCandidates]
      .filter((c) => candidatePassesHardFitment(input, c))
      .map((c) => ({
        ...c,
        score: scoreCandidate(input, c),
      }))
      .sort((a, b) => b.score - a.score);

    console.log(
      "Top scored candidates:",
      allCandidates.slice(0, 5).map((c) => ({
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