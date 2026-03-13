import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const kind = searchParams.get("kind");
  const make = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";
  const engine = searchParams.get("engine") ?? "";
  const year = searchParams.get("year") ?? "";

  try {
    if (kind === "years") {
      const vehicles = await prisma.vehicle.findMany({
        select: { year: true },
        distinct: ["year"],
        orderBy: { year: "desc" },
      });

      return NextResponse.json({
        items: vehicles.map((x) => String(x.year)),
      });
    }

    if (kind === "makes") {
      if (!year) {
        const makes = await prisma.make.findMany({
          select: { name: true },
          orderBy: { name: "asc" },
        });

        return NextResponse.json({
          items: makes.map((x) => x.name),
        });
      }

      const vehicles = await prisma.vehicle.findMany({
        where: {
          year: Number(year),
        },
        select: {
          make: {
            select: { name: true },
          },
        },
        distinct: ["makeId"],
        orderBy: {
          make: { name: "asc" },
        },
      });

      return NextResponse.json({
        items: vehicles.map((x) => x.make.name),
      });
    }

    if (kind === "models") {
      if (!make || !year) return NextResponse.json({ items: [] });

      const vehicles = await prisma.vehicle.findMany({
        where: {
          year: Number(year),
          make: { name: make },
        },
        select: {
          model: {
            select: { name: true },
          },
        },
        distinct: ["modelId"],
        orderBy: {
          model: { name: "asc" },
        },
      });

      return NextResponse.json({
        items: vehicles.map((x) => x.model.name),
      });
    }

    if (kind === "engines") {
      if (!make || !model || !year) return NextResponse.json({ items: [] });

      const vehicles = await prisma.vehicle.findMany({
        where: {
          year: Number(year),
          make: { name: make },
          model: { name: model },
        },
        select: {
          engine: {
            select: { name: true },
          },
        },
        distinct: ["engineId"],
        orderBy: {
          engine: { name: "asc" },
        },
      });

      return NextResponse.json({
        items: vehicles.map((x) => x.engine.name),
      });
    }

    if (kind === "partTypes") {
      if (!make || !model || !engine || !year) {
        return NextResponse.json({ items: [] });
      }

      const parts = await prisma.vehiclePartType.findMany({
  where: {
    vehicle: {
          year: Number(year),
          make: { name: make },
          model: { name: model },
          engine: { name: engine },
        },
      },
    select: {
      partType: {
        select: {
          name: true,
      },
    },
  },
  orderBy: {
    partType: {
      name: "asc",
    },
  },
});

return NextResponse.json({
  items: [...new Set(parts.map((x) => x.partType.name))],
}); 
    }

    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error("fitment api error", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}