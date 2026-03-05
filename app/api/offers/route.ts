import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSellPriceFromCost } from "@/lib/pricing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const partType = searchParams.get("partType") ?? "";
  const yearStr = searchParams.get("year") ?? "";
  const make = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";

  if (!partType || !yearStr || !make || !model) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const year = Number(yearStr);

  // 🔎 SEARCH DATABASE (not mockA)
  const offers = await prisma.offer.findMany({
    where: {
      partType,
      year,
      make,
      model,
      qtyAvailable: { gt: 0 },
    },
    include: {
      product: true,
    },
    orderBy: { cost: "asc" },
  });

  if (offers.length === 0) {
    return NextResponse.json({ error: "No offers found." }, { status: 404 });
  }

  const best = offers[0];

  const price = calculateSellPriceFromCost(best.cost);

  return NextResponse.json({
    product: {
      title: best.product.title,
      description: best.product.description,
      imageUrl: best.product.imageUrl,
      partType: best.partType,
    },
    availability: {
      inStock: true,
      qty: best.qtyAvailable,
      leadTimeDays: best.leadTimeDays,
    },
    pricing: {
      itemPriceCents: price.itemPriceCents,
      hstCents: price.hstCents,
      totalCents: price.totalCents,
      currency: "CAD",
    },
  });
}