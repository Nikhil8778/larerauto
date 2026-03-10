import * as cheerio from "cheerio";
import type { VendorPriceResult, VendorUrlLookupInput } from "./types";
import {
  buildDefaultHeaders,
  cleanText,
  extractPriceCentsFromText,
  getMetaContent,
} from "./utils";

export async function fetchAmazonPrice(
  input: VendorUrlLookupInput
): Promise<VendorPriceResult> {
  try {
    if (!input.url) {
      return {
        priceCents: null,
        productUrl: null,
        productTitle: null,
        inStock: null,
        error: "Missing Amazon URL",
      };
    }

    const res = await fetch(input.url, {
      method: "GET",
      headers: {
        ...buildDefaultHeaders(),
        referer: "https://www.amazon.ca/",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        priceCents: null,
        productUrl: input.url,
        productTitle: null,
        inStock: null,
        error: `Amazon HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      cleanText($("#productTitle").text()) ||
      getMetaContent($, "og:title") ||
      $("title").text().trim() ||
      null;

    const whole = $("#priceblock_ourprice").text()
      || $("#priceblock_dealprice").text()
      || $("#priceblock_saleprice").text()
      || $(".a-price .a-offscreen").first().text()
      || $('[data-a-color="price"] .a-offscreen').first().text()
      || getMetaContent($, "og:price:amount")
      || getMetaContent($, "product:price:amount")
      || $.root().text();

    const priceCents = extractPriceCentsFromText(whole);

    const pageText = cleanText($.root().text()).toLowerCase();
    const blocked =
      pageText.includes("enter the characters you see below") ||
      pageText.includes("sorry, we just need to make sure you're not a robot");

    const inStock =
      pageText.includes("in stock")
        ? true
        : pageText.includes("currently unavailable") || pageText.includes("out of stock")
        ? false
        : null;

    return {
      priceCents,
      productUrl: input.url,
      productTitle: title,
      inStock,
      error: blocked
        ? "Amazon anti-bot page detected"
        : priceCents === null
        ? "Could not parse Amazon price"
        : null,
    };
  } catch (error) {
    return {
      priceCents: null,
      productUrl: input.url ?? null,
      productTitle: null,
      inStock: null,
      error: error instanceof Error ? error.message : "Unknown Amazon error",
    };
  }
}