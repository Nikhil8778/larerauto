import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const make = (searchParams.get("make") ?? "").trim();
  const model = (searchParams.get("model") ?? "").trim();
  const partType = (searchParams.get("partType") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();

  const takeRaw = Number(searchParams.get("take") ?? "20");
  const take = Number.isFinite(takeRaw) ? Math.max(1, Math.min(100, takeRaw)) : 20;

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

  const [offers, makeRows, modelRows, partTypeRows] = await Promise.all([
    prisma.offer.findMany({
      take,
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
        candidates: {
          where: {
            vendor: "amazon",
          },
          orderBy: {
            score: "desc",
          },
          take: 10,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
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

  const rows = offers.map((offer) => ({
    id: offer.id,
    offerId: offer.id,
    make: offer.vehicle.make.name,
    model: offer.vehicle.model.name,
    engine: offer.vehicle.engine.name,
    year: offer.vehicle.year,
    partType: offer.part.partType.name,
    title: offer.part.title,
    syncStatus: offer.syncStatus,
    syncError: offer.syncError,
    selectedPriceCents:
      offer.sourceId === "amazon"
        ? offer.amazonPriceCents
        : offer.referencePriceCents ?? null,
    sellPriceCents: offer.sellPriceCents,
    amazonUrl: offer.amazonUrl,
    candidates: offer.candidates.map((candidate) => ({
      id: candidate.id,
      vendor: candidate.vendor,
      title: candidate.title,
      productUrl: candidate.productUrl,
      priceCents: candidate.priceCents,
      score: candidate.score,
      selected: candidate.selected,
      badge: candidate.badge,
      inStock: candidate.inStock,
      rawText: candidate.rawText,
    })),
  }));

  return NextResponse.json({
    rows,
    makeOptions: makeRows.map((r) => r.name),
    modelOptions: modelRows.map((r) => r.name),
    partTypeOptions: partTypeRows.map((r) => r.name),
  });
}
