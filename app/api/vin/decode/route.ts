import { NextResponse } from "next/server";

type NhtsaResult = {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  DisplacementL?: string;
  EngineCylinders?: string;
  Trim?: string;
};

function normalizeEngine(displacementL?: string, cylinders?: string) {
  const d = (displacementL ?? "").trim();
  const c = (cylinders ?? "").trim();

  if (!d && !c) return "";

  if (d && c) return `${d}L I${c}`;
  if (d) return `${d}L`;
  return `I${c}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vin = (searchParams.get("vin") ?? "").trim().toUpperCase();

  if (!vin) {
    return NextResponse.json({ error: "VIN is required" }, { status: 400 });
  }

  if (vin.length !== 17) {
    return NextResponse.json({ error: "VIN must be 17 characters" }, { status: 400 });
  }

  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to decode VIN" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const vehicle: NhtsaResult | undefined = data?.Results?.[0];

    if (!vehicle) {
      return NextResponse.json(
        { error: "No VIN result found" },
        { status: 404 }
      );
    }

    const make = (vehicle.Make ?? "").trim();
    const model = (vehicle.Model ?? "").trim();
    const year = Number(vehicle.ModelYear ?? 0);
    const engine = normalizeEngine(vehicle.DisplacementL, vehicle.EngineCylinders);
    const trim = (vehicle.Trim ?? "").trim();

    if (!make || !model || !year) {
      return NextResponse.json(
        {
          error: "VIN decoded but required fields are missing",
          raw: vehicle,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      vin,
      make,
      model,
      year,
      engine,
      trim,
      raw: vehicle,
    });
  } catch (error) {
    console.error("VIN decode error:", error);

    return NextResponse.json(
      { error: "Unexpected VIN decode error" },
      { status: 500 }
    );
  }
}