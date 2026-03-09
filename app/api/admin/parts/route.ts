import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
      },
      orderBy: [
        { vehicle: { make: { name: "asc" } } },
        { vehicle: { model: { name: "asc" } } },
        { vehicle: { year: "desc" } },
      ],
    });

    const rows = offers.map((offer) => ({
      offerId: offer.id,
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      engine: offer.vehicle.engine.name,
      year: offer.vehicle.year,
      partType: offer.part.partType,
      title: offer.part.title,
      inventoryQty: offer.inventoryQty,
      sellPriceCents: offer.sellPriceCents,
      currency: offer.currency,
      sourceId: offer.sourceId,
    }));

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("admin parts api error", error);
    return NextResponse.json({ rows: [] }, { status: 500 });
  }
}