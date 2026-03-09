import type { VendorLookupInput, VendorPriceResult } from "./types";

function buildAPremiumSearchUrl(input: VendorLookupInput) {
  const query = [
    input.year,
    input.make,
    input.model,
    input.engine,
    input.partType,
  ]
    .filter(Boolean)
    .join(" ");

  return `https://ca.a-premium.com/search?keyword=${encodeURIComponent(query)}`;
}

/**
 * TEMP VERSION:
 * Right now this returns a structured placeholder result.
 * Later we will replace this with real fetch + parse logic.
 */
export async function fetchAPremiumPrice(
  input: VendorLookupInput
): Promise<VendorPriceResult> {
  try {
    const searchUrl = buildAPremiumSearchUrl(input);

    // Placeholder result for now
    // We are only building the sync engine structure first.
    return {
      priceCents: null,
      productUrl: searchUrl,
      productTitle: null,
      inStock: null,
      error: "A-Premium live scraping not implemented yet",
    };
  } catch (error) {
    return {
      priceCents: null,
      productUrl: null,
      productTitle: null,
      inStock: null,
      error: error instanceof Error ? error.message : "Unknown A-Premium error",
    };
  }
}