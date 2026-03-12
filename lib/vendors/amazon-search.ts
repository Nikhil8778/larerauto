import * as cheerio from "cheerio";
import type { CandidateSearchInput, VendorSearchCandidate } from "./candidate-types";
import { fetchAmazonProductPagePrice } from "./amazon-product";

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parsePriceToCentsFromWholeFraction(whole: string, fraction: string) {
  const cleanedWhole = whole.replace(/[^0-9]/g, "");
  const cleanedFraction = fraction.replace(/[^0-9]/g, "");

  if (!cleanedWhole) return null;

  const amount = Number(`${cleanedWhole}.${cleanedFraction || "00"}`);
  if (!Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}

function parsePriceToCentsFromText(text: string) {
  const match = text.match(/(\d[\d,]*)\s*\.?\s*(\d{2})?/);
  if (!match) return null;

  const whole = (match[1] ?? "").replace(/,/g, "");
  const fraction = match[2] ?? "00";

  const amount = Number(`${whole}.${fraction}`);
  if (!Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}

function normalizeRef(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function isLikelyReferenceNumber(value: string) {
  const v = normalizeRef(value);

  if (v.length < 5) return false;
  if (!/\d/.test(v)) return false;

  // reject plain year
  if (/^(19|20)\d{2}$/.test(v)) return false;

  // reject date-like values like 20170222
  if (/^(19|20)\d{6}$/.test(v)) return false;

  // reject concatenated year ranges like 20142019 / 20182020
  if (/^(19|20)\d{2}(19|20)\d{2}$/.test(v)) return false;

  // reject obvious CSS / HTML-ish junk
  if (
    [
      "DATANIMG",
      "BOXSIZING",
      "MINWIDTH",
      "MAXWIDTH",
      "MINHEIGHT",
      "MAXHEIGHT",
      "CODEYEAR",
      "FETCHPRIORITY",
      "DECODING",
      "LOADING",
      "SRCSET",
      "STYLE",
      "WIDTH",
      "HEIGHT",
    ].includes(v)
  ) {
    return false;
  }

  return true;
}

function extractReferenceNumbers(text: string) {
  const matches =
    text.match(
      /\b[A-Z0-9]{2,6}-[A-Z0-9]{2,6}-?[A-Z0-9]{0,6}\b|\b[A-Z]{1,5}\d{3,10}[A-Z]?\b|\b\d{5}-\d{5}\b|\b\d{5,10}[A-Z]?\b/gi
    ) ?? [];

  return [...new Set(matches.map(normalizeRef).filter(isLikelyReferenceNumber))];
}

function buildAmazonQueries(input: CandidateSearchInput) {
  const baseQuery = [
    input.year,
    input.make,
    input.model,
    input.engine,
    input.partType,
  ]
    .filter(Boolean)
    .join(" ");

  const refQueries = (input.referenceNumbers ?? [])
    .map((ref) => normalizeRef(ref))
    .filter(isLikelyReferenceNumber)
    .slice(0, 3)
    .map((ref) => `${ref} ${input.partType}`);

  return [baseQuery, ...refQueries];
}

function buildAmazonSearchUrl(query: string) {
  return `https://www.amazon.ca/s?k=${encodeURIComponent(query)}`;
}

function seemsRelevantForAmazon(title: string, partType: string) {
  const t = title.toLowerCase();
  const p = partType.toLowerCase();

  if (p.includes("alternator")) {
    return (
      t.includes("alternator") &&
      !t.includes("starter") &&
      !t.includes("regulator") &&
      !t.includes("voltage regulator") &&
      !t.includes("brush")
    );
  }

  if (p.includes("starter")) {
    return (
      (t.includes("starter") || t.includes("starter motor")) &&
      !t.includes("alternator")
    );
  }

  if (p.includes("brake pad")) {
    return (
      (t.includes("brake pad") || (t.includes("brake") && t.includes("pad"))) &&
      !t.includes("shoe")
    );
  }

  if (p.includes("rotor")) {
    return (
      t.includes("rotor") &&
      !t.includes("pad only") &&
      !t.includes("shoe") &&
      !t.includes("caliper")
    );
  }

  if (p.includes("fuel tank")) {
    return (
      (t.includes("fuel tank") || t.includes("gas tank")) &&
      !t.includes("fuel cap") &&
      !t.includes("gas cap") &&
      !t.includes("strap") &&
      !t.includes("filler") &&
      !t.includes("filler neck") &&
      !t.includes("reservoir") &&
      !t.includes("coolant") &&
      !t.includes("sensor") &&
      !t.includes("pump") &&
      !t.includes("sending unit")
    );
  }

  return t.includes(p);
}

function randomDelay(minMs: number, maxMs: number) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function fetchWithRetry(url: string, options: RequestInit) {
  const res = await fetch(url, options);

  if (res.status === 503) {
    console.log("Amazon 503 detected — retrying after delay...");
    await randomDelay(5000, 7000);
    return fetch(url, options);
  }

  return res;
}

export async function searchAmazonCandidates(
  input: CandidateSearchInput
): Promise<VendorSearchCandidate[]> {
  const queries = buildAmazonQueries(input);
  const seenUrls = new Set<string>();
  const lightweightCandidates: VendorSearchCandidate[] = [];

  try {
    for (const query of queries) {
      const url = buildAmazonSearchUrl(query);
      console.log("Amazon search query:", query);
      console.log("Amazon search URL:", url);

      await randomDelay(2500, 4500);

      const res = await fetchWithRetry(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-CA,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "Upgrade-Insecure-Requests": "1",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.log("Amazon non-OK status:", res.status, "for query:", query);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const resultItems = $('div[data-component-type="s-search-result"]');

      resultItems.each((_, el) => {
        if (lightweightCandidates.length >= 16) return false;

        const node = $(el);

        const title =
          cleanText(node.find("h2 span").first().text()) ||
          cleanText(node.find("a h2 span").first().text());

        const relativeUrl =
          node.find("h2 a").attr("href") ||
          node.find("a.a-link-normal.s-no-outline").attr("href") ||
          node.find("a.a-link-normal").attr("href");

        const productUrl = relativeUrl
          ? new URL(relativeUrl, "https://www.amazon.ca").toString()
          : "";

        if (!title || !productUrl) return;
        if (!seemsRelevantForAmazon(title, input.partType)) return;
        if (seenUrls.has(productUrl)) return;

        seenUrls.add(productUrl);

        const whole = cleanText(node.find(".a-price .a-price-whole").first().text());
        const fraction = cleanText(
          node.find(".a-price .a-price-fraction").first().text()
        );

        let searchPagePriceCents = parsePriceToCentsFromWholeFraction(
          whole,
          fraction
        );

        if (searchPagePriceCents === null) {
          const offscreenPrice = cleanText(
            node.find(".a-price .a-offscreen").first().text()
          );
          if (offscreenPrice) {
            searchPagePriceCents = parsePriceToCentsFromText(offscreenPrice);
          }
        }

        const badgeText = cleanText(
          node.find(".a-badge-text").first().text() ||
            node.find('[aria-label*="Best Seller"]').first().text()
        );

        const ratingText =
          cleanText(node.find("span.a-icon-alt").first().text()) ||
          cleanText(
            node.find('[aria-label*="out of 5 stars"]').first().attr("aria-label")
          );

        const reviewText =
          cleanText(node.find("span.a-size-base.s-underline-text").first().text()) ||
          cleanText(node.find("a[href*='customerReviews'] span").last().text());

        const rawText = cleanText(node.text());
        const inStock = /in stock/i.test(rawText)
          ? true
          : /out of stock/i.test(rawText)
          ? false
          : null;

        const referenceNumbers = extractReferenceNumbers(`${title} ${rawText}`);

        lightweightCandidates.push({
          vendor: "amazon",
          title,
          productUrl,
          priceCents: searchPagePriceCents,
          badge: badgeText || null,
          inStock,
          rawText: `${rawText} | rating:${ratingText} | reviews:${reviewText}`.slice(
            0,
            3000
          ),
          referenceNumbers,
        });
      });
    }

    const enrichedCandidates: VendorSearchCandidate[] = [];

    for (const candidate of lightweightCandidates) {
      await randomDelay(3500, 6000);

      const pageData = await fetchAmazonProductPagePrice(candidate.productUrl);

      const mergedRawText = [candidate.rawText ?? "", pageData.rawText ?? ""]
        .filter(Boolean)
        .join(" | ");

      const mergedRefs = [
        ...(candidate.referenceNumbers ?? []),
        ...extractReferenceNumbers(mergedRawText),
      ];

      enrichedCandidates.push({
        ...candidate,
        priceCents: candidate.priceCents ?? pageData.priceCents ?? null,
        rawText: mergedRawText,
        referenceNumbers: [...new Set(mergedRefs)],
      });
    }

    console.log(
      "Amazon candidates enriched:",
      enrichedCandidates.map((c) => ({
        title: c.title,
        priceCents: c.priceCents,
        referenceNumbers: c.referenceNumbers,
      }))
    );

    return enrichedCandidates;
  } catch (error) {
    console.error("Amazon candidate search failed:", error);
    return [];
  }
}