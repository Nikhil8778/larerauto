import * as cheerio from "cheerio";
import type { CandidateSearchInput, VendorSearchCandidate } from "./candidate-types";

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parsePriceToCents(priceText: string) {
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}

function buildAmazonSearchUrl(input: CandidateSearchInput) {
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

export async function searchAmazonCandidates(
  input: CandidateSearchInput
): Promise<VendorSearchCandidate[]> {
  const url = buildAmazonSearchUrl(input);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates: VendorSearchCandidate[] = [];

    // Amazon search result blocks
    const resultItems = $('div[data-component-type="s-search-result"]');

    resultItems.each((_, el) => {
      if (candidates.length >= 5) return false;

      const node = $(el);

      const title =
        cleanText(node.find("h2 span").first().text()) ||
        cleanText(node.find("a h2 span").first().text());

      const relativeUrl = node.find("h2 a").attr("href") || node.find("a.a-link-normal").attr("href");
      const productUrl = relativeUrl
        ? new URL(relativeUrl, "https://www.amazon.ca").toString()
        : "";

      const whole = cleanText(node.find(".a-price .a-price-whole").first().text());
      const fraction = cleanText(node.find(".a-price .a-price-fraction").first().text());
      const combinedPrice = whole ? `${whole}.${fraction || "00"}` : "";
      const priceCents = parsePriceToCents(combinedPrice);

      const badgeText = cleanText(
        node.find(".a-badge-text").first().text() ||
          node.find('[aria-label*="Best Seller"]').first().text()
      );

      const availabilityText = cleanText(node.text());
      const inStock =
        /in stock/i.test(availabilityText) ? true : /out of stock/i.test(availabilityText) ? false : null;

      // Basic filtering
      if (!title || !productUrl) return;

      // Skip obvious sponsored placeholders if title is weirdly empty/short
      if (title.length < 5) return;

      candidates.push({
        vendor: "amazon",
        title,
        productUrl,
        priceCents,
        badge: badgeText || null,
        inStock,
        rawText: cleanText(node.text()).slice(0, 2000),
      });
    });

    return candidates;
  } catch (error) {
    console.error("Amazon candidate search failed:", error);
    return [];
  }
}