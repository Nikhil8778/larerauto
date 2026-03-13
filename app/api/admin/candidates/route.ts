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
    part: {
      include: {
        partType: true,
      },
    },
    candidates: true,
  },
});
  return NextResponse.json(offers.map((offer) => ({
    id: offer.id,
    make: offer.vehicle.make.name,
    model: offer.vehicle.model.name,
    engine: offer.vehicle.engine.name,
    year: offer.vehicle.year,
    partType: offer.part.partType.name,
    title: offer.part.title,
    candidates: offer.candidates,
  }))
  );
}
  
