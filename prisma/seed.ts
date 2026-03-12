import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ExpandedFitmentRow = {
  make: string;
  model: string;
  engine: string;
  year: number;
  partTypes: string[];
};

type SeedMake = {
  make: string;
  models: {
    model: string;
    engines: {
      engine: string;
      years: number[];
      partTypes?: string[];
    }[];
  }[];
};

const DEFAULT_PART_TYPES = [
  "Rotors & Brake Pads",
  "Calipers",
  "Bearings",
  "Brake Drum",
  "Alternators",
  "Starters",
  "Fuel Tanks",
  "Batteries",
  "Lights & Bulbs",
  "Fuses",
  "Control Arms",
  "Wheel Bearings",
  "Sway Bar Links",
  "Struts",
  "Shocks",
  "AC Compressor",
  "AC Condenser & Evaporator",
  "Tensioners & Pulleys",
  "Blower Motor",
  "Radiators",
  "Fuel Injectors",
  "Fuel Pumps",
  "Timing Belts",
  "Gaskets",
  "Spark Plugs",
] as const;

const VEHICLE_TREE: SeedMake[] = [
  {
    make: "Hyundai",
    models: [
      {
        model: "Tucson",
        engines: [
          { engine: "2.0L I4", years: [2017, 2018, 2019] },
          { engine: "2.4L I4", years: [2018, 2019, 2020, 2021] },
          { engine: "1.6L Turbo", years: [2019, 2020, 2021] },
        ],
      },
      {
        model: "Elantra",
        engines: [
          { engine: "1.8L I4", years: [2016, 2017] },
          { engine: "2.0L I4", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "Sonata",
        engines: [
          { engine: "2.4L I4", years: [2017, 2018, 2019] },
          { engine: "1.6L Turbo", years: [2018, 2019, 2020] },
        ],
      },
    ],
  },
  {
    make: "Toyota",
    models: [
      {
        model: "Corolla",
        engines: [
          { engine: "1.8L I4", years: [2017, 2018, 2019, 2020] },
          { engine: "2.0L I4", years: [2020, 2021, 2022] },
        ],
      },
      {
        model: "Camry",
        engines: [
          { engine: "2.5L I4", years: [2017, 2018, 2019, 2020, 2021, 2022] },
          { engine: "3.5L V6", years: [2017, 2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "RAV4",
        engines: [
          { engine: "2.5L I4", years: [2017, 2018, 2019, 2020, 2021, 2022] },
        ],
      },
    ],
  },
  {
    make: "Honda",
    models: [
      {
        model: "Civic",
        engines: [
          { engine: "2.0L I4", years: [2017, 2018, 2019, 2020, 2021, 2022] },
          { engine: "1.5L Turbo", years: [2017, 2018, 2019, 2020, 2021, 2022] },
        ],
      },
      {
        model: "Accord",
        engines: [
          { engine: "1.5L Turbo", years: [2018, 2019, 2020, 2021, 2022] },
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "CR-V",
        engines: [
          { engine: "1.5L Turbo", years: [2017, 2018, 2019, 2020, 2021, 2022] },
          { engine: "2.4L I4", years: [2017, 2018, 2019] },
        ],
      },
    ],
  },
  {
    make: "Ford",
    models: [
      {
        model: "Escape",
        engines: [
          { engine: "1.5L Turbo", years: [2017, 2018, 2019, 2020] },
          { engine: "2.0L I4", years: [2017, 2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "F-150",
        engines: [
          { engine: "3.5L V6", years: [2018, 2019, 2020, 2021] },
          { engine: "5.0L V8", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "Explorer",
        engines: [
          { engine: "2.3L Turbo", years: [2018, 2019, 2020, 2021] },
          { engine: "3.5L V6", years: [2017, 2018, 2019] },
        ],
      },
    ],
  },
  {
    make: "Nissan",
    models: [
      {
        model: "Altima",
        engines: [
          { engine: "2.5L I4", years: [2017, 2018, 2019, 2020, 2021] },
          { engine: "2.0L Turbo", years: [2019, 2020, 2021] },
        ],
      },
      {
        model: "Sentra",
        engines: [
          { engine: "1.8L I4", years: [2017, 2018, 2019] },
          { engine: "2.0L I4", years: [2020, 2021, 2022] },
        ],
      },
      {
        model: "Rogue",
        engines: [
          { engine: "2.5L I4", years: [2017, 2018, 2019, 2020, 2021] },
        ],
      },
    ],
  },
  {
    make: "Audi",
    models: [
      {
        model: "A4",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "A5",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "A6",
        engines: [
          { engine: "2.0L Turbo", years: [2019, 2020, 2021] },
          { engine: "3.0L V6", years: [2019, 2020, 2021] },
        ],
      },
      {
        model: "Q5",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
    ],
  },
  {
    make: "BMW",
    models: [
      {
        model: "3 Series",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
          { engine: "3.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "X3",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "X5",
        engines: [
          { engine: "3.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
    ],
  },
  {
    make: "Mercedes-Benz",
    models: [
      {
        model: "C-Class",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
        ],
      },
      {
        model: "E-Class",
        engines: [
          { engine: "2.0L Turbo", years: [2018, 2019, 2020, 2021] },
          { engine: "3.0L V6", years: [2018, 2019, 2020] },
        ],
      },
      {
        model: "GLC",
        engines: [
          { engine: "2.0L Turbo", years: [2019, 2020, 2021] },
        ],
      },
    ],
  },
];

const PART_CATALOG: Record<
  string,
  {
    title: string;
    description: string;
    imageUrl: string;
    costPriceCents: number;
    sellPriceCents: number;
    leadTimeDays: number;
  }
> = {
  "Rotors & Brake Pads": {
    title: "Rotors & Brake Pads (Demo)",
    description: "Brake service combo package with rotors and pads.",
    imageUrl: "/products/Rotors.webp",
    costPriceCents: 9500,
    sellPriceCents: 18900,
    leadTimeDays: 2,
  },
  Calipers: {
    title: "Calipers (Demo)",
    description: "Direct-fit replacement calipers.",
    imageUrl: "/products/Calipers.jpg",
    costPriceCents: 7000,
    sellPriceCents: 16000,
    leadTimeDays: 2,
  },
  Bearings: {
    title: "Bearings (Demo)",
    description: "Durable replacement bearings.",
    imageUrl: "/products/Bearings.jpg",
    costPriceCents: 4200,
    sellPriceCents: 9800,
    leadTimeDays: 2,
  },
  "Brake Drum": {
    title: "Brake Drum (Demo)",
    description: "Reliable brake drum replacement.",
    imageUrl: "/products/Brake-Drum.jpg",
    costPriceCents: 5000,
    sellPriceCents: 11500,
    leadTimeDays: 2,
  },
  Alternators: {
    title: "Alternator (Demo)",
    description: "Quality replacement alternator.",
    imageUrl: "/products/Alternators.png",
    costPriceCents: 15000,
    sellPriceCents: 28000,
    leadTimeDays: 2,
  },
  Starters: {
    title: "Starter (Demo)",
    description: "Reliable replacement starter motor.",
    imageUrl: "/products/Starters.webp",
    costPriceCents: 11000,
    sellPriceCents: 21000,
    leadTimeDays: 2,
  },
  "Fuel Tanks": {
    title: "Fuel Tank (Demo)",
    description: "Direct fit replacement fuel tank.",
    imageUrl: "/products/Fuel-Tanks.jpg",
    costPriceCents: 12000,
    sellPriceCents: 25000,
    leadTimeDays: 3,
  },
  Batteries: {
    title: "Battery (Demo)",
    description: "Reliable vehicle battery replacement.",
    imageUrl: "/products/Batteries.jpg",
    costPriceCents: 9000,
    sellPriceCents: 17500,
    leadTimeDays: 2,
  },
  "Lights & Bulbs": {
    title: "Lights & Bulbs (Demo)",
    description: "Replacement bulbs and lighting components.",
    imageUrl: "/products/Lights-Bulb.jpg",
    costPriceCents: 1800,
    sellPriceCents: 4900,
    leadTimeDays: 2,
  },
  Fuses: {
    title: "Fuses (Demo)",
    description: "Electrical fuse replacements.",
    imageUrl: "/products/Fuses.jpg",
    costPriceCents: 700,
    sellPriceCents: 2400,
    leadTimeDays: 2,
  },
  "Control Arms": {
    title: "Control Arms (Demo)",
    description: "Suspension control arm replacement.",
    imageUrl: "/products/Control-Arms.webp",
    costPriceCents: 6500,
    sellPriceCents: 14500,
    leadTimeDays: 2,
  },
  "Wheel Bearings": {
    title: "Wheel Bearings (Demo)",
    description: "Wheel bearing replacement unit.",
    imageUrl: "/products/Wheel-Bearings.png",
    costPriceCents: 4800,
    sellPriceCents: 10800,
    leadTimeDays: 2,
  },
  "Sway Bar Links": {
    title: "Sway Bar Links (Demo)",
    description: "Stabilizer link replacement.",
    imageUrl: "/products/Sway-Bar-Links.jpg",
    costPriceCents: 2200,
    sellPriceCents: 5900,
    leadTimeDays: 2,
  },
  Struts: {
    title: "Struts (Demo)",
    description: "Suspension strut replacement.",
    imageUrl: "/products/Struts.jpg",
    costPriceCents: 8000,
    sellPriceCents: 16800,
    leadTimeDays: 2,
  },
  Shocks: {
    title: "Shocks (Demo)",
    description: "Shock absorber replacement.",
    imageUrl: "/products/Shocks.jpg",
    costPriceCents: 6500,
    sellPriceCents: 14200,
    leadTimeDays: 2,
  },
  "AC Compressor": {
    title: "AC Compressor (Demo)",
    description: "Air conditioning compressor replacement.",
    imageUrl: "/products/AC-Compressor.jpg",
    costPriceCents: 14000,
    sellPriceCents: 29500,
    leadTimeDays: 3,
  },
  "AC Condenser & Evaporator": {
    title: "AC Condenser & Evaporator (Demo)",
    description: "Cooling system AC condenser and evaporator parts.",
    imageUrl: "/products/AC-Evaporator.jpg",
    costPriceCents: 11000,
    sellPriceCents: 23800,
    leadTimeDays: 3,
  },
  "Tensioners & Pulleys": {
    title: "Tensioners & Pulleys (Demo)",
    description: "Accessory belt tensioner and pulley replacement.",
    imageUrl: "/products/Tensioners-Pulleys.jpg",
    costPriceCents: 3200,
    sellPriceCents: 7900,
    leadTimeDays: 2,
  },
  "Blower Motor": {
    title: "Blower Motor (Demo)",
    description: "HVAC blower motor replacement.",
    imageUrl: "/products/Blower-Motor.jpg",
    costPriceCents: 5000,
    sellPriceCents: 11800,
    leadTimeDays: 2,
  },
  Radiators: {
    title: "Radiator (Demo)",
    description: "Cooling radiator replacement.",
    imageUrl: "/products/Radiators.jpg",
    costPriceCents: 9000,
    sellPriceCents: 18900,
    leadTimeDays: 3,
  },
  "Fuel Injectors": {
    title: "Fuel Injectors (Demo)",
    description: "Direct-fit fuel injector replacement.",
    imageUrl: "/products/Fuel-Injectors.jpg",
    costPriceCents: 4500,
    sellPriceCents: 10200,
    leadTimeDays: 3,
  },
  "Fuel Pumps": {
    title: "Fuel Pump (Demo)",
    description: "Reliable fuel pump replacement.",
    imageUrl: "/products/Fuel-Pumps.webp",
    costPriceCents: 9000,
    sellPriceCents: 19000,
    leadTimeDays: 3,
  },
  "Timing Belts": {
    title: "Timing Belt (Demo)",
    description: "Timing belt replacement.",
    imageUrl: "/products/Timing-Belts.jpg",
    costPriceCents: 3800,
    sellPriceCents: 9200,
    leadTimeDays: 2,
  },
  Gaskets: {
    title: "Gaskets (Demo)",
    description: "Engine gasket replacement.",
    imageUrl: "/products/Gaskets.jpg",
    costPriceCents: 1500,
    sellPriceCents: 4200,
    leadTimeDays: 2,
  },
  "Spark Plugs": {
    title: "Spark Plugs (Demo)",
    description: "Spark plug replacement set.",
    imageUrl: "/products/Spark-plugs.webp",
    costPriceCents: 1400,
    sellPriceCents: 3900,
    leadTimeDays: 2,
  },
};

function expandVehicleTree(tree: SeedMake[]): ExpandedFitmentRow[] {
  const rows: ExpandedFitmentRow[] = [];

  for (const makeNode of tree) {
    for (const modelNode of makeNode.models) {
      for (const engineNode of modelNode.engines) {
        for (const year of engineNode.years) {
          rows.push({
            make: makeNode.make,
            model: modelNode.model,
            engine: engineNode.engine,
            year,
            partTypes: engineNode.partTypes
              ? [...engineNode.partTypes]
              : [...DEFAULT_PART_TYPES],
          });
        }
      }
    }
  }

  return rows;
}

function buildSourceSku(row: ExpandedFitmentRow, partType: string) {
  return `${partType}-${row.make}-${row.model}-${row.year}-${row.engine}`
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .toUpperCase();
}

async function getOrCreateMake(name: string) {
  const existing = await prisma.make.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.make.create({ data: { name } });
}

async function getOrCreateModel(makeId: string, name: string) {
  const existing = await prisma.model.findFirst({
    where: { makeId, name },
  });
  if (existing) return existing;
  return prisma.model.create({
    data: { makeId, name },
  });
}

async function getOrCreateEngine(modelId: string, name: string) {
  const existing = await prisma.engine.findFirst({
    where: { modelId, name },
  });
  if (existing) return existing;
  return prisma.engine.create({
    data: { modelId, name },
  });
}

async function getOrCreateVehicle(params: {
  makeId: string;
  modelId: string;
  engineId: string;
  year: number;
}) {
  const existing = await prisma.vehicle.findFirst({
    where: {
      makeId: params.makeId,
      modelId: params.modelId,
      engineId: params.engineId,
      year: params.year,
    },
  });
  if (existing) return existing;

  return prisma.vehicle.create({
    data: params,
  });
}

async function getOrCreatePart(partType: string) {
  const existing = await prisma.part.findFirst({
    where: { partType },
  });
  if (existing) return existing;

  const config = PART_CATALOG[partType] ?? {
    title: `${partType} (Demo)`,
    description: `Demo part for ${partType}.`,
    imageUrl: "/products/placeholder.png",
    costPriceCents: 5000,
    sellPriceCents: 10000,
    leadTimeDays: 2,
  };

  return prisma.part.create({
    data: {
      partType,
      title: config.title,
      description: config.description,
      imageUrl: config.imageUrl,
    },
  });
}

async function main() {
  const fitments = expandVehicleTree(VEHICLE_TREE);

  console.log("Expanded fitment rows:", fitments.length);

  await prisma.vendorCandidate.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.engine.deleteMany();
  await prisma.model.deleteMany();
  await prisma.make.deleteMany();
  await prisma.part.deleteMany();

  let offerCount = 0;

  for (const row of fitments) {
    const make = await getOrCreateMake(row.make);
    const model = await getOrCreateModel(make.id, row.model);
    const engine = await getOrCreateEngine(model.id, row.engine);

    const vehicle = await getOrCreateVehicle({
      makeId: make.id,
      modelId: model.id,
      engineId: engine.id,
      year: row.year,
    });

    for (const partType of row.partTypes) {
      const part = await getOrCreatePart(partType);
      const config = PART_CATALOG[partType] ?? {
        costPriceCents: 5000,
        sellPriceCents: 10000,
        leadTimeDays: 2,
      };

      const existingOffer = await prisma.offer.findFirst({
        where: {
          vehicleId: vehicle.id,
          partId: part.id,
        },
      });

      if (existingOffer) continue;

      await prisma.offer.create({
        data: {
          vehicleId: vehicle.id,
          partId: part.id,
          sourceId: "manual",
          sourceSku: buildSourceSku(row, partType),
          inventoryQty: 2,
          costPriceCents: config.costPriceCents,
          referencePriceCents: config.sellPriceCents,
          sellPriceCents: config.sellPriceCents,
          currency: "CAD",
          leadTimeDays: config.leadTimeDays,
          syncStatus: "success",
        },
      });

      offerCount++;
    }
  }

  console.log("✅ Fitment seed complete");
  console.log("Vehicle tree makes:", VEHICLE_TREE.length);
  console.log("Expanded vehicle rows:", fitments.length);
  console.log("Offers created:", offerCount);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });