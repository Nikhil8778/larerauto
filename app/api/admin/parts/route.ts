import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const make = (searchParams.get("make") ?? "").trim();
  const model = (searchParams.get("model") ?? "").trim();
  const partType = (searchParams.get("partType") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();
  const inventory = (searchParams.get("inventory") ?? "").trim();

  const where: any = {};

  if (make) {
    where.vehicle = {
      ...(where.vehicle ?? {}),
      make: {
        name: {
          equals: make,
          mode: "insensitive",
        },
      },
    };
  }

  if (model) {
    where.vehicle = {
      ...(where.vehicle ?? {}),
      model: {
        name: {
          equals: model,
          mode: "insensitive",
        },
      },
    };
  }

  if (partType) {
    where.part = {
      ...(where.part ?? {}),
      partType: {
        name: {
          equals: partType,
          mode: "insensitive",
        },
      },
    };
  }

  if (status) {
    where.syncStatus = {
      equals: status,
      mode: "insensitive",
    };
  }

  if (inventory === "low") {
    where.inventoryQty = { lte: 2 };
  } else if (inventory === "out") {
    where.inventoryQty = 0;
  }

  const [offers, makeRows, modelRows, partTypeRows] = await Promise.all([
    prisma.offer.findMany({
      where,
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

    prisma.model.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
      take: 500,
    }),

    prisma.partType.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
      take: 200,
    }),
  ]);

  const rows = offers.map((offer) => {
    let selectedPriceCents: number | null = null;

    if (offer.sourceId === "amazon") {
      selectedPriceCents = offer.amazonPriceCents;
    } else if (offer.sourceId === "apremium") {
      selectedPriceCents = offer.aPremiumPriceCents;
    } else {
      selectedPriceCents = offer.referencePriceCents ?? null;
    }

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
      aPremiumPriceCents: offer.aPremiumPriceCents,
      selectedPriceCents,
      sellPriceCents: offer.sellPriceCents,
      amazonUrl: offer.amazonUrl ?? "",
      aPremiumUrl: offer.aPremiumUrl ?? "",
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
    modelOptions: modelRows.map((r) => r.name),
    partTypeOptions: partTypeRows.map((r) => r.name),
  });
}