import * as cheerio from "cheerio";
import type { VendorPriceResult, VendorUrlLookupInput } from "./types";
import {
  buildDefaultHeaders,
  cleanText,
  extractPriceCentsFromText,
  getMetaContent,
} from "./utils";

export async function fetchAPremiumPrice(
  input: VendorUrlLookupInput
): Promise<VendorPriceResult> {
  try {
    if (!input.url) {
      return {
        priceCents: null,
        productUrl: null,
        productTitle: null,
        inStock: null,
        error: "Missing A-Premium URL",
      };
    }

    const res = await fetch(input.url, {
      method: "GET",
      headers: buildDefaultHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        priceCents: null,
        productUrl: input.url,
        productTitle: null,
        inStock: null,
        error: `A-Premium HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      cleanText($("h1").first().text()) ||
      getMetaContent($, "og:title") ||
      $("title").text().trim() ||
      null;

    const priceCandidates = [
      $(".price").first().text(),
      $(".product-price").first().text(),
      $(".special-price").first().text(),
      $(".sale-price").first().text(),
      $('[class*="price"]').first().text(),
      getMetaContent($, "product:price:amount"),
      getMetaContent($, "og:price:amount"),
      $.root().text(),
    ];

    let priceCents: number | null = null;
    for (const candidate of priceCandidates) {
      priceCents = extractPriceCentsFromText(candidate);
      if (priceCents !== null) break;
    }

    const pageText = cleanText($.root().text()).toLowerCase();
    const inStock =
      pageText.includes("in stock") ||
      pageText.includes("available") ||
      pageText.includes("add to cart")
        ? true
        : pageText.includes("out of stock")
        ? false
        : null;

    return {
      priceCents,
      productUrl: input.url,
      productTitle: title,
      inStock,
      error: priceCents === null ? "Could not parse A-Premium price" : null,
    };
  } catch (error) {
    return {
      priceCents: null,
      productUrl: input.url ?? null,
      productTitle: null,
      inStock: null,
      error: error instanceof Error ? error.message : "Unknown A-Premium error",
    };
  }
}