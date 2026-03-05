import { DistributorAdapter } from "./types";

export const mockA: DistributorAdapter = {
  sourceId: "distA",
  async searchQuote(input) {
    // TODO replace with real API call later
    const baseCost = {
      Alternators: 12000,
      "Brake Pads": 4000,
      Calipers: 9000,
      Bearings: 6000,
    } as Record<string, number>;

    const costCents = baseCost[input.partType] ?? 8000;

    return [
      {
        sourceId: "distA",
        sourceSku: `${input.partType}-A`,
        costCents,
        qtyAvailable: 3,
        leadTimeDays: 2,
        currency: "CAD",
        title: `${input.partType} (Premium)`,
        description: "Quality replacement part. Fitment confirmed by your vehicle details.",
        imageUrl: "/products/placeholder.png",
      },
    ];
  },
};