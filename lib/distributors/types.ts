export type DistributorOffer = {
  sourceId: string;        // "distA"
  sourceSku?: string;
  costCents: number;       // your buy price
  qtyAvailable: number;
  leadTimeDays?: number;
  currency?: "CAD";
  title?: string;
  description?: string;
  imageUrl?: string;
};

export type QuoteInput = {
  partType: string;
  year: string;
  make: string;
  model: string;
  vin?: string;
};

export type DistributorAdapter = {
  sourceId: string;
  searchQuote: (input: QuoteInput) => Promise<DistributorOffer[]>;
};