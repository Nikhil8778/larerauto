import { prisma } from "@/lib/prisma";

type GetQuoteInput = {
  make: string;
  model: string;
  year: number;
  engine: string;
  partType: string;
};

type GetQuoteResult =
  | {
      success: true;
      result: {
        title?: string | null;
        make: string;
        model: string;
        year: number;
        engine: string;
        partType: string;
        price: string;
        currency: string;
        inventoryQty?: number | null;
      };
    }
  | {
      success: false;
      message: string;
    };

function normalizeText(value: string) {
  return value.trim();
}

export async function getChatbotQuote(
  input: GetQuoteInput
): Promise<GetQuoteResult> {
  const make = normalizeText(input.make);
  const model = normalizeText(input.model);
  const year = Number(input.year);
  const engine = normalizeText(input.engine);
  const partType = normalizeText(input.partType);

  if (!make || !model || !year || !engine || !partType) {
    return {
      success: false,
      message: "Missing required vehicle or part details.",
    };
  }

  const offer = await prisma.offer.findFirst({
    where: {
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
            contains: engine,
            mode: "insensitive",
          },
        },
      },
      part: {
        partType: {
          name: {
            contains: partType,
            mode: "insensitive",
          },
        },
      },
    },
    orderBy: {
      sellPriceCents: "asc",
    },
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
  });

  if (!offer) {
    return {
      success: false,
      message:
        "Sorry, I could not find an exact match right now. Please contact us on WhatsApp and we’ll help you manually.",
    };
  }

  return {
    success: true,
    result: {
      title: offer.part.title,
      make: offer.vehicle.make.name,
      model: offer.vehicle.model.name,
      year: offer.vehicle.year,
      engine: offer.vehicle.engine.name,
      partType: offer.part.partType.name,
      price: (offer.sellPriceCents / 100).toFixed(2),
      currency: offer.currency || "CAD",
      inventoryQty: offer.inventoryQty,
    },
  };
}