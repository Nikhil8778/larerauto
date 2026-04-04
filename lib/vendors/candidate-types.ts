export type CandidateSearchInput = {
  make: string;
  model: string;
  year: number;
  engine: string;
  partType: string;
  referenceNumbers?: string[];
};

export type VendorSearchCandidate = {
  vendor: "amazon" | "apremium";
  title: string;
  productUrl: string;
  priceCents: number | null;
  badge?: string | null;
  inStock?: boolean | null;
  rawText?: string | null;
  referenceNumbers?: string[];
  scrapedProductId?: string | null;
  asin?: string | null;
  canonicalKey?: string | null;
  sellerStore?: string | null;
  preferredSupplier?: boolean | null;
  inventoryCount?: number | null;
  inventoryText?: string | null;
  fitmentConfirmed?: boolean | null;
  cannotConfirmFit?: boolean | null;
};