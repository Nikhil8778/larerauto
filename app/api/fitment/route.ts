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
    if (kind === "makes") {
      const makes = await prisma.make.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        items: makes.map((x) => x.name),
      });
    }

    if (kind === "models") {
      if (!make) return NextResponse.json({ items: [] });

      const models = await prisma.model.findMany({
        where: {
          make: { name: make },
        },
        select: { name: true },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        items: models.map((x) => x.name),
      });
    }

    if (kind === "engines") {
      if (!make || !model) return NextResponse.json({ items: [] });

      const engines = await prisma.engine.findMany({
        where: {
          model: {
            name: model,
            make: { name: make },
          },
        },
        select: { name: true },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        items: engines.map((x) => x.name),
      });
    }

    if (kind === "years") {
      if (!make || !model || !engine) return NextResponse.json({ items: [] });

      const vehicles = await prisma.vehicle.findMany({
        where: {
          make: { name: make },
          model: { name: model },
          engine: { name: engine },
        },
        select: { year: true },
        orderBy: { year: "desc" },
      });

      return NextResponse.json({
        items: vehicles.map((x) => String(x.year)),
      });
    }

    if (kind === "partTypes") {
      if (!make || !model || !engine || !year) {
        return NextResponse.json({ items: [] });
      }

      const parts = await prisma.part.findMany({
        where: {
          offers: {
            some: {
              vehicle: {
                make: { name: make },
                model: { name: model },
                engine: { name: engine },
                year: Number(year),
              },
            },
          },
        },
        select: { partType: true },
        distinct: ["partType"],
        orderBy: { partType: "asc" },
      });

      return NextResponse.json({
        items: parts.map((x) => x.partType),
      });
    }

    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error("fitment api error", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}