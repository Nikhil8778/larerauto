import { prisma } from "@/lib/prisma";

type FindBestOfferInput = {
  partType: string;
  year: string;
  make: string;
  model: string;
  engine?: string;
};

export async function findBestOffer(input: FindBestOfferInput) {
  const partType = input.partType.trim();
  const make = input.make.trim();
  const model = input.model.trim();
  const engine = input.engine?.trim() ?? "";
  const yearInt = Number(input.year);

  if (!partType || !make || !model) return null;
  if (!Number.isFinite(yearInt)) return null;

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
        year: yearInt,
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
    orderBy: [{ sellPriceCents: "asc" }],
    take: 10,
  });

  if (!offers.length) return null;

  const best = offers[0];

  return {
    offerId: best.id,
    partType: best.part.partType.name,
    title: best.part.title ?? best.part.partType.name,
    description: best.part.description ?? "",
    imageUrl: best.part.imageUrl ?? "",
    stockQty: best.inventoryQty,
    itemPrice: best.sellPriceCents / 100,
  };
}