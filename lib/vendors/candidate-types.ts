export type VendorSearchCandidate = {
  vendor: "amazon" | "apremium";
  title: string;
  productUrl: string;
  priceCents: number | null;
  badge?: string | null;
  inStock?: boolean | null;
  rawText?: string | null;
};

export type CandidateSearchInput = {
  make: string;
  model: string;
  year: number;
  engine: string;
  partType: string;
};