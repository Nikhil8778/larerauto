import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const make = (searchParams.get("make") ?? "").trim();
  const model = (searchParams.get("model") ?? "").trim();
  const engine = (searchParams.get("engine") ?? "").trim();
  const yearRaw = (searchParams.get("year") ?? "").trim();
  const partType = (searchParams.get("partType") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();
  const inventory = (searchParams.get("inventory") ?? "").trim();

  const year =
    yearRaw && Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : undefined;

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

  if (typeof year === "number") {
    vehicleWhere.year = year;
  }

  const offerWhere: any = {};

  if (Object.keys(vehicleWhere).length > 0) {
    offerWhere.vehicle = vehicleWhere;
  }

  if (partType) {
    offerWhere.part = {
      ...(offerWhere.part ?? {}),
      partType: {
        name: {
          equals: partType,
          mode: "insensitive",
        },
      },
    };
  }

  if (status) {
    offerWhere.syncStatus = {
      equals: status,
      mode: "insensitive",
    };
  }

  if (inventory === "low") {
    offerWhere.inventoryQty = { lte: 2 };
  } else if (inventory === "out") {
    offerWhere.inventoryQty = 0;
  }

  const [
    offers,
    makeRows,
    vehiclesForModels,
    vehiclesForEngines,
    vehiclesForYears,
    offersForPartTypes,
  ] = await Promise.all([
    prisma.offer.findMany({
      where: offerWhere,
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
      take: 100,
    }),

    prisma.make.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
      take: 200,
    }),

    prisma.vehicle.findMany({
      where: make
        ? {
            make: {
              name: {
                equals: make,
                mode: "insensitive",
              },
            },
          }
        : {},
      include: {
        model: true,
      },
      take: 5000,
    }),

    prisma.vehicle.findMany({
      where: {
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
        ...(model
          ? {
              model: {
                name: {
                  equals: model,
                  mode: "insensitive",
                },
              },
            }
          : {}),
      },
      include: {
        engine: true,
      },
      take: 5000,
    }),

    prisma.vehicle.findMany({
      where: {
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
        ...(model
          ? {
              model: {
                name: {
                  equals: model,
                  mode: "insensitive",
                },
              },
            }
          : {}),
        ...(engine
          ? {
              engine: {
                name: {
                  equals: engine,
                  mode: "insensitive",
                },
              },
            }
          : {}),
      },
      select: {
        year: true,
      },
      take: 5000,
    }),

    prisma.offer.findMany({
      where: {
        ...(Object.keys(vehicleWhere).length > 0 ? { vehicle: vehicleWhere } : {}),
      },
      include: {
        part: {
          include: {
            partType: true,
          },
        },
      },
      take: 5000,
    }),
  ]);

  const modelOptions = [...new Set(vehiclesForModels.map((v) => v.model.name))].sort(
    (a, b) => a.localeCompare(b)
  );

  const engineOptions = [...new Set(vehiclesForEngines.map((v) => v.engine.name))].sort(
    (a, b) => a.localeCompare(b)
  );

  const yearOptions = [...new Set(vehiclesForYears.map((v) => String(v.year)))].sort(
    (a, b) => Number(b) - Number(a)
  );

  const partTypeOptions = [
    ...new Set(offersForPartTypes.map((o) => o.part.partType.name)),
  ].sort((a, b) => a.localeCompare(b));

  const rows = offers.map((offer) => {
    const selectedPriceCents =
      offer.sourceId === "amazon"
        ? offer.amazonPriceCents
        : offer.referencePriceCents ?? null;

    return {
      offerId: offer.id,
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      engine: offer.vehicle.engine.name,
      year: offer.vehicle.year,
      partType: offer.part.partType.name,
      title: offer.part.title,
      inventoryQty: offer.inventoryQty,
      sourceId: offer.sourceId,
      currency: offer.currency,
      amazonPriceCents: offer.amazonPriceCents,
      selectedPriceCents,
      sellPriceCents: offer.sellPriceCents,
      amazonUrl: offer.amazonUrl ?? "",
      syncStatus: offer.syncStatus ?? "",
      syncError: offer.syncError ?? "",
      lastPriceSyncAt: offer.lastPriceSyncAt
        ? offer.lastPriceSyncAt.toISOString()
        : "",
    };
  });

  return NextResponse.json({
    rows,
    makeOptions: makeRows.map((r) => r.name),
    modelOptions,
    engineOptions,
    yearOptions,
    partTypeOptions,
  });
}