import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const offers = await prisma.offer.findMany({
    include: {
      vehicle: {
        include: {
          make: true,
          model: true,
          engine: true,
        },
      },
      part: true,
      candidates: {
        orderBy: {
          score: "desc",
        },
      },
    },
  });

  const rows = offers.map((offer) => ({
    offerId: offer.id,
    make: offer.vehicle.make.name,
    model: offer.vehicle.model.name,
    engine: offer.vehicle.engine.name,
    year: offer.vehicle.year,
    partType: offer.part.partType,
    title: offer.part.title,
    candidates: offer.candidates,
  }));

  return NextResponse.json({ rows });
}