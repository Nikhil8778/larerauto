import { prisma } from "@/lib/prisma";
import { calculateSellPriceFromCost } from "@/lib/pricing";

type FindBestOfferInput = {
  partType: string;
  year: string;
  make: string;
  model: string;
};

export async function findBestOffer(input: FindBestOfferInput) {
  const partType = input.partType.trim();
  const make = input.make.trim();
  const model = input.model.trim();
  const yearInt = Number(input.year);

  if (!partType || !make || !model) return null;
  if (!Number.isFinite(yearInt) || yearInt < 1900 || yearInt > new Date().getFullYear() + 1) return null;

  const offers = await prisma.offer.findMany({
    where: {
      partType,
      year: yearInt,
      // Case-insensitive match (Postgres supports this)
      make: { equals: make, mode: "insensitive" },
      model: { equals: model, mode: "insensitive" },
    },
    include: { product: true },
    orderBy: [
      { qtyAvailable: "desc" }, // prefer in-stock
      { cost: "asc" },          // then cheapest
    ],
    take: 10,
  });

  if (!offers.length) return null;

  const best = offers.find((o) => o.qtyAvailable > 0) ?? offers[0];

  // cost is stored in cents in DB
  const pricing = calculateSellPriceFromCost(best.cost);

  return {
    offerId: best.id,
    partType: best.partType,
    title: best.product?.title ?? best.partType,
    description: best.product?.description ?? "",
    imageUrl: best.product?.imageUrl ?? "",
    stockQty: best.qtyAvailable,
    // show item price BEFORE tax/delivery
    itemPrice: pricing.subtotal,
  };
}