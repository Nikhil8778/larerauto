import type { VendorLookupInput, VendorPriceResult } from "./types";

function buildAmazonSearchUrl(input: VendorLookupInput) {
  const query = [
    input.year,
    input.make,
    input.model,
    input.engine,
    input.partType,
  ]
    .filter(Boolean)
    .join(" ");

  return `https://www.amazon.ca/s?k=${encodeURIComponent(query)}`;
}

/**
 * TEMP VERSION:
 * Returns a structured placeholder result.
 * Later we will replace this with real fetch + parse logic.
 */
export async function fetchAmazonPrice(
  input: VendorLookupInput
): Promise<VendorPriceResult> {
  try {
    const searchUrl = buildAmazonSearchUrl(input);

    return {
      priceCents: null,
      productUrl: searchUrl,
      productTitle: null,
      inStock: null,
      error: "Amazon live scraping not implemented yet",
    };
  } catch (error) {
    return {
      priceCents: null,
      productUrl: null,
      productTitle: null,
      inStock: null,
      error: error instanceof Error ? error.message : "Unknown Amazon error",
    };
  }
}