export type VendorPriceResult = {
  priceCents: number | null;
  productUrl: string | null;
  productTitle: string | null;
  inStock?: boolean | null;
  error?: string | null;
};

export type VendorLookupInput = {
  make: string;
  model: string;
  year: number;
  engine: string;
  partType: string;
};

export type VendorUrlLookupInput = {
  url: string | null | undefined;
  make: string;
  model: string;
  year: number;
  engine: string;
  partType: string;
};