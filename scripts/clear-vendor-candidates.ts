import { prisma } from "@/lib/prisma";

function getArg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function main() {
  const makeArg = getArg("make");
  const partTypeArg = getArg("partType");
  const dryRunArg = getArg("dryRun");
  const dryRun = dryRunArg === "true";

  console.log("Clearing vendor candidates with options:", {
    make: makeArg ?? null,
    partType: partTypeArg ?? null,
    dryRun,
  });

  const offers = await prisma.offer.findMany({
    where: {
      ...(makeArg
        ? {
            vehicle: {
              make: {
                name: {
                  equals: makeArg,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
      ...(partTypeArg
        ? {
            part: {
              partType: {
                name: {
                  equals: partTypeArg,
                  mode: "insensitive",
                },
              },
            },
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
      candidates: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const offerIds = offers.map((offer) => offer.id);
  const candidateCount = offers.reduce(
    (sum, offer) => sum + offer.candidates.length,
    0
  );

  console.log(`Matched offers: ${offers.length}`);
  console.log(`Matched vendor candidates: ${candidateCount}`);

  if (offers.length > 0) {
    console.log(
      "Sample matched offers:",
      offers.slice(0, 10).map((offer) => ({
        offerId: offer.id,
        make: offer.vehicle.make.name,
        model: offer.vehicle.model.name,
        engine: offer.vehicle.engine.name,
        year: offer.vehicle.year,
        partType: offer.part.partType.name,
        title: offer.part.title,
        candidateCount: offer.candidates.length,
      }))
    );
  }

  if (offerIds.length === 0) {
    console.log("No matching offers found. Nothing to clear.");
    return;
  }

  if (dryRun) {
    console.log("Dry run only. No changes were made.");
    return;
  }

  const deletedCandidates = await prisma.vendorCandidate.deleteMany({
    where: {
      offerId: {
        in: offerIds,
      },
    },
  });

  const resetOffers = await prisma.offer.updateMany({
    where: {
      id: {
        in: offerIds,
      },
    },
    data: {
      amazonPriceCents: null,
      aPremiumPriceCents: null,
      amazonUrl: null,
      aPremiumUrl: null,
      referencePriceCents: null,
      syncStatus: null,
      syncError: null,
      lastPriceSyncAt: null,
      sourceId: "manual",
    },
  });

  console.log("Deleted vendor candidates:", deletedCandidates.count);
  console.log("Reset offers:", resetOffers.count);
  console.log("Vendor candidate cleanup complete.");
}

main().catch((error) => {
  console.error("Failed to clear vendor candidates:", error);
  process.exit(1);
});