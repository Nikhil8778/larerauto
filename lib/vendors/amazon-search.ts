import * as cheerio from "cheerio";
import type {
  CandidateSearchInput,
  VendorSearchCandidate,
} from "./candidate-types";
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

  if (/^(19|20)\d{2}$/.test(v)) return false;
  if (/^(19|20)\d{6}$/.test(v)) return false;
  if (/^(19|20)\d{2}(19|20)\d{2}$/.test(v)) return false;

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
  // Keep this narrow to reduce cost and noise
  return [
    [input.year, input.make, input.model, input.engine, input.partType]
      .filter(Boolean)
      .join(" "),
  ];
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

function buildZenRowsUrl(targetUrl: string, jsRender = false) {
  const apiKey = process.env.ZENROWS_API_KEY;

  if (!apiKey) {
    throw new Error("ZENROWS_API_KEY is missing in environment variables");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    url: targetUrl,
    js_render: jsRender ? "true" : "false",
    premium_proxy: "true",
  });

  return `https://api.zenrows.com/v1/?${params.toString()}`;
}

async function fetchViaZenRows(targetUrl: string, jsRender = false) {
  const zenRowsUrl = buildZenRowsUrl(targetUrl, jsRender);

  const res = await fetch(zenRowsUrl, {
    method: "GET",
    cache: "no-store",
  });

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
      const amazonUrl = buildAmazonSearchUrl(query);

      console.log("Amazon search query:", query);
      console.log("Amazon search URL:", amazonUrl);

      await randomDelay(1200, 2000);

      let res = await fetchViaZenRows(amazonUrl, false);

      if (!res.ok) {
        console.log("ZenRows Amazon search non-OK status:", res.status);
        await randomDelay(1500, 2500);
        res = await fetchViaZenRows(amazonUrl, true);
      }

      if (!res.ok) {
        console.log("ZenRows Amazon search failed for query:", query);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      const resultItems = $('div[data-component-type="s-search-result"]');

      resultItems.each((_, el) => {
        if (lightweightCandidates.length >= 12) return false;

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
      await randomDelay(1000, 1800);

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