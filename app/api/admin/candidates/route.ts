import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const offers = await prisma.offer.findMany({
    take: 20,
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
        orderBy: {
          score: "desc",
        },
        take: 10,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const rows = offers.map((offer) => ({
    id: offer.id,
    make: offer.vehicle.make.name,
    model: offer.vehicle.model.name,
    engine: offer.vehicle.engine.name,
    year: offer.vehicle.year,
    partType: offer.part.partType.name,
    title: offer.part.title,
    candidates: offer.candidates.map((candidate) => ({
      id: candidate.id,
      vendor: candidate.vendor,
      title: candidate.title,
      productUrl: candidate.productUrl,
      priceCents: candidate.priceCents,
      score: candidate.score,
      selected: candidate.selected,
    })),
  }));

  return NextResponse.json({ rows });
}
