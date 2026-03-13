import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const partType = searchParams.get("partType") ?? "";
  const yearStr = searchParams.get("year") ?? "";
  const make = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";
  const engine = searchParams.get("engine") ?? "";
  const vin = searchParams.get("vin") ?? "";

  if (!partType || !yearStr || !make || !model || !engine) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  const year = Number(yearStr);

  if (!Number.isFinite(year)) {
    return NextResponse.json(
      { error: "Invalid year." },
      { status: 400 }
    );
  }

  console.log("offers query:", {
    partType,
    year,
    make,
    model,
    engine,
    vin,
  });

  const offers = await prisma.offer.findMany({
    where: {
      inventoryQty: { gt: 0 },
      part: {
        partType: {
          name: {
            equals: partType,
            mode: "insensitive",
          },
        },
      },
      vehicle: {
        year,
        make: {
          name: {
            equals: make,
            mode: "insensitive",
          },
        },
        model: {
          name: {
            equals: model,
            mode: "insensitive",
          },
        },
        engine: {
          name: {
            equals: engine,
            mode: "insensitive",
          },
        },
      },
    },
    include: {
      part: {
        include: {
          partType: true,
        },
      },
      vehicle: {
        include: {
          make: true,
          model: true,
          engine: true,
        },
      },
    },
    orderBy: {
      sellPriceCents: "asc",
    },
  });

  console.log(
    "offers found:",
    offers.map((o) => ({
      id: o.id,
      inventoryQty: o.inventoryQty,
      sellPriceCents: o.sellPriceCents,
      partType: o.part.partType.name,
      make: o.vehicle.make.name,
      model: o.vehicle.model.name,
      engine: o.vehicle.engine.name,
      year: o.vehicle.year,
    }))
  );

  if (offers.length === 0) {
    return NextResponse.json(
      { error: "No offers found." },
      { status: 404 }
    );
  }

  const best = offers[0];

  const quote = await prisma.quote.create({
    data: {
      make,
      model,
      engine,
      year,
      partType,
      vin: vin || null,
      bestOfferId: best.id,
      itemPriceCents: best.sellPriceCents,
    },
  });

  return NextResponse.json({
    quoteId: quote.id,
    product: {
      title: best.part.title,
      description: best.part.description,
      imageUrl: best.part.imageUrl,
      partType: best.part.partType.name,
    },
    availability: {
      inStock: best.inventoryQty > 0,
      qty: best.inventoryQty,
      leadTimeDays: best.leadTimeDays ?? null,
    },
    pricing: {
      itemPriceCents: best.sellPriceCents,
      currency: best.currency ?? "CAD",
    },
  });
}