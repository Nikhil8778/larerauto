import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function engineLooksCompatible(dbEngine: string, decodedEngine: string) {
  const db = normalize(dbEngine);
  const dec = normalize(decodedEngine);

  if (!dec) return true;
  if (db === dec) return true;
  if (db.includes(dec) || dec.includes(db)) return true;

  const dbLiters = db.match(/\d+(\.\d+)?l/)?.[0] ?? "";
  const decLiters = dec.match(/\d+(\.\d+)?l/)?.[0] ?? "";

  if (dbLiters && decLiters && dbLiters === decLiters) return true;

  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const make = (searchParams.get("make") ?? "").trim();
  const model = (searchParams.get("model") ?? "").trim();
  const year = Number(searchParams.get("year") ?? 0);
  const engine = (searchParams.get("engine") ?? "").trim();

  if (!make || !model || !year) {
    return NextResponse.json(
      { error: "make, model, year are required" },
      { status: 400 }
    );
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
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
      },
      include: {
        make: true,
        model: true,
        engine: true,
        offers: {
          include: {
            part: true,
          },
        },
      },
    });

    if (vehicles.length === 0) {
      return NextResponse.json({
        matched: false,
        vehicle: null,
        offers: [],
        message: "No matching vehicle found in local database",
      });
    }

    let bestVehicle = vehicles[0];

    for (const v of vehicles) {
      if (engineLooksCompatible(v.engine.name, engine)) {
        bestVehicle = v;
        break;
      }
    }

    const offers = bestVehicle.offers.map((offer) => {
      let selectedPriceCents: number | null = null;

      if (offer.sourceId === "amazon") {
        selectedPriceCents = offer.amazonPriceCents;
      } else if (offer.sourceId === "apremium") {
        selectedPriceCents = offer.aPremiumPriceCents;
      }

      return {
        offerId: offer.id,
        partId: offer.partId,
        partType: offer.part.partType,
        title: offer.part.title,
        sellPriceCents: offer.sellPriceCents,
        selectedPriceCents,
        amazonPriceCents: offer.amazonPriceCents,
        aPremiumPriceCents: offer.aPremiumPriceCents,
        sourceId: offer.sourceId,
        syncStatus: offer.syncStatus,
        amazonUrl: offer.amazonUrl,
        aPremiumUrl: offer.aPremiumUrl,
      };
    });

    return NextResponse.json({
      matched: true,
      vehicle: {
        id: bestVehicle.id,
        make: bestVehicle.make.name,
        model: bestVehicle.model.name,
        year: bestVehicle.year,
        engine: bestVehicle.engine.name,
      },
      offers,
    });
  } catch (error) {
    console.error("VIN fitment lookup error:", error);

    return NextResponse.json(
      { error: "Unexpected fitment lookup error" },
      { status: 500 }
    );
  }
}