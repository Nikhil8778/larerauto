import { prisma } from "@/lib/prisma";

const PART_KEYWORDS: Record<string, string[]> = {
  "Rotors & Brake Pads": ["brake pads", "pads", "rotors", "rotor", "brakes"],
  "Calipers": ["caliper", "calipers"],
  "Alternators": ["alternator", "alternators"],
  "Starters": ["starter", "starters"],
  "Bearings": ["bearing", "bearings"],
  "Wheel Bearings": ["wheel bearing", "wheel bearings"],
  "Spark Plugs": ["spark plug", "spark plugs"],
  "Ignition Coils": ["ignition coil", "ignition coils", "coil", "coils"],
  "Fuel Pumps": ["fuel pump", "fuel pumps"],
  "Fuel Injectors": ["fuel injector", "fuel injectors"],
  "Radiators": ["radiator", "radiators"],
  "Shocks": ["shock", "shocks"],
  "Struts": ["strut", "struts"],
  "Control Arms": ["control arm", "control arms"],
  "Sway Bar Links": ["sway bar link", "sway bar links"],
  "Batteries": ["battery", "batteries"],
  "AC Compressor": ["ac compressor", "compressor"],
};

function normalizeText(input: string) {
  return input.toLowerCase().trim();
}

export function detectPartType(body: string): string | null {
  const text = normalizeText(body);

  for (const [partType, keywords] of Object.entries(PART_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return partType;
    }
  }

  return null;
}

export function extractYear(body: string): number | null {
  const match = body.match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

export async function detectMake(body: string): Promise<string | null> {
  const text = normalizeText(body);

  const makes = await prisma.make.findMany({
    select: { name: true },
  });

  const found = makes.find((m) => text.includes(m.name.toLowerCase()));
  return found?.name || null;
}

export async function detectModel(make: string, body: string): Promise<string | null> {
  const text = normalizeText(body);

  const makeRow = await prisma.make.findFirst({
    where: { name: { equals: make, mode: "insensitive" } },
    select: { id: true },
  });

  if (!makeRow) return null;

  const models = await prisma.model.findMany({
    where: { makeId: makeRow.id },
    select: { name: true },
  });

  const found = models.find((m) => text.includes(m.name.toLowerCase()));
  return found?.name || null;
}

export async function detectEngine(
  make: string,
  model: string,
  body: string
): Promise<string | null> {
  const text = normalizeText(body);

  const makeRow = await prisma.make.findFirst({
    where: { name: { equals: make, mode: "insensitive" } },
    select: { id: true },
  });
  if (!makeRow) return null;

  const modelRow = await prisma.model.findFirst({
    where: {
      makeId: makeRow.id,
      name: { equals: model, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (!modelRow) return null;

  const engines = await prisma.engine.findMany({
    where: { modelId: modelRow.id },
    select: { name: true },
  });

  const found = engines.find((e) => text.includes(e.name.toLowerCase()));
  return found?.name || null;
}

export async function findBestOffer(params: {
  year: number;
  make: string;
  model: string;
  engine: string;
  partType: string;
}) {
  const offers = await prisma.offer.findMany({
    where: {
      inventoryQty: { gt: 0 },
      part: {
        partType: {
          name: {
            equals: params.partType,
            mode: "insensitive",
          },
        },
      },
      vehicle: {
        year: params.year,
        make: {
          name: { equals: params.make, mode: "insensitive" },
        },
        model: {
          name: { equals: params.model, mode: "insensitive" },
        },
        engine: {
          name: { equals: params.engine, mode: "insensitive" },
        },
      },
    },
    include: {
      part: {
        include: {
          partType: true,
        },
      },
    },
    orderBy: {
      sellPriceCents: "asc",
    },
    take: 1,
  });

  return offers[0] || null;
}

export function buildMissingQuestion(state: {
  partType?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  engine?: string | null;
}) {
  if (!state.partType) {
    return "Sure. Which part do you need? For example: brake pads, alternator, starter, rotors.";
  }

  const missing: string[] = [];
  if (!state.year) missing.push("year");
  if (!state.make) missing.push("make");
  if (!state.model) missing.push("model");
  if (!state.engine) missing.push("engine");

  if (missing.length === 0) return null;

  return `Sure. Please send your ${missing.join(", ")} for the ${state.partType}. Example: 2020 Hyundai Elantra 2.0L.`;
}