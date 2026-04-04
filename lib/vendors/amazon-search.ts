import * as cheerio from "cheerio";
import type {
  CandidateSearchInput,
  VendorSearchCandidate,
} from "./candidate-types";
import { fetchAmazonProductPagePrice } from "./amazon-product";
import { scoreCandidate } from "./candidate-score";
import { fetchVendorHtml } from "./fetch-with-fallback";

const MAX_QUERY_COUNT = 2;
const MAX_LIGHTWEIGHT_CANDIDATES = 4;
const MAX_ENRICHED_CANDIDATES = 2;

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
  const cleaned = cleanText(text).replace(/,/g, "");
  const match = cleaned.match(/(\d+(?:\.\d{2})?)/);
  if (!match?.[1]) return null;

  const amount = Number(match[1]);
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

function uniqueQueries(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const q = cleanText(value);
    if (!q) continue;

    const key = q.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(q);
  }

  return result;
}

function buildAmazonQueries(input: CandidateSearchInput) {
  const refs = (input.referenceNumbers ?? []).slice(0, 1);

  return uniqueQueries([
    [input.year, input.make, input.model, input.engine, input.partType]
      .filter(Boolean)
      .join(" "),
    [input.make, input.model, input.engine, input.partType]
      .filter(Boolean)
      .join(" "),
    ...refs.map((ref) =>
      [input.make, input.model, input.partType, ref].filter(Boolean).join(" ")
    ),
  ]).slice(0, MAX_QUERY_COUNT);
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

function canonicalAmazonUrl(relativeOrAbsolute: string) {
  try {
    const url = new URL(relativeOrAbsolute, "https://www.amazon.ca");
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

function extractSearchItems($: cheerio.CheerioAPI) {
  return $(
    [
      'div[data-component-type="s-search-result"]',
      ".s-result-item[data-asin]",
      'div[data-asin][data-component-type="s-search-result"]',
    ].join(", ")
  );
}

function parseCandidatesFromDom(
  $: cheerio.CheerioAPI,
  input: CandidateSearchInput,
  seenUrls: Set<string>,
  limit: number
): VendorSearchCandidate[] {
  const candidates: VendorSearchCandidate[] = [];
  const resultItems = extractSearchItems($);

  resultItems.each((_, el) => {
    if (candidates.length >= limit) return false;

    const node = $(el);

    const title =
      cleanText(node.find("h2 span").first().text()) ||
      cleanText(node.find("a h2 span").first().text()) ||
      cleanText(node.find("h2").first().text());

    const relativeUrl =
      node.find("h2 a").attr("href") ||
      node.find("a.a-link-normal.s-no-outline").attr("href") ||
      node.find('a.a-link-normal[href*="/dp/"]').attr("href") ||
      node.find('a[href*="/dp/"]').attr("href");

    const productUrl = relativeUrl ? canonicalAmazonUrl(relativeUrl) : "";

    if (!title || !productUrl) return;
    if (!seemsRelevantForAmazon(title, input.partType)) return;
    if (seenUrls.has(productUrl)) return;

    seenUrls.add(productUrl);

    const whole = cleanText(node.find(".a-price .a-price-whole").first().text());
    const fraction = cleanText(
      node.find(".a-price .a-price-fraction").first().text()
    );

    let searchPagePriceCents = parsePriceToCentsFromWholeFraction(whole, fraction);

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
      : /out of stock|currently unavailable/i.test(rawText)
      ? false
      : null;

    const referenceNumbers = extractReferenceNumbers(`${title} ${rawText}`);

    candidates.push({
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

  return candidates;
}

export async function searchAmazonCandidates(
  input: CandidateSearchInput
): Promise<VendorSearchCandidate[]> {
  const queries = buildAmazonQueries(input);
  const seenUrls = new Set<string>();
  const lightweightCandidates: VendorSearchCandidate[] = [];

  try {
    for (const query of queries) {
      if (lightweightCandidates.length >= MAX_LIGHTWEIGHT_CANDIDATES) break;

      const amazonUrl = buildAmazonSearchUrl(query);

      await randomDelay(250, 500);

      let fetched = await fetchVendorHtml(amazonUrl, {
        jsRender: false,
        premiumProxy: false,
      });

      if (!fetched.ok) {
        fetched = await fetchVendorHtml(amazonUrl, {
          jsRender: true,
          premiumProxy: true,
        });
      }

      if (!fetched.ok) {
        console.log(
          `Amazon search failed provider=${fetched.provider} status=${fetched.status} query=${query}`
        );
        continue;
      }

      let html = fetched.html;
      let $ = cheerio.load(html);
      let resultItems = extractSearchItems($);

      const hasRobotText =
        /sorry, we just need to make sure you're not a robot|enter the characters you see below/i.test(
          html
        );

      if (resultItems.length === 0 || hasRobotText) {
        const jsFetched = await fetchVendorHtml(amazonUrl, {
          jsRender: true,
          premiumProxy: true,
        });

        if (jsFetched.ok) {
          html = jsFetched.html;
          $ = cheerio.load(html);
          resultItems = extractSearchItems($);
        }
      }

      const parsed = parseCandidatesFromDom(
        $,
        input,
        seenUrls,
        MAX_LIGHTWEIGHT_CANDIDATES - lightweightCandidates.length
      );

      lightweightCandidates.push(...parsed);
    }

    const preRanked = lightweightCandidates
      .map((candidate) => ({
        ...candidate,
        preScore: scoreCandidate(input, candidate),
      }))
      .sort((a, b) => {
        const aPriced = a.priceCents !== null ? 1 : 0;
        const bPriced = b.priceCents !== null ? 1 : 0;

        if (bPriced !== aPriced) return bPriced - aPriced;
        return b.preScore - a.preScore;
      })
      .slice(0, MAX_ENRICHED_CANDIDATES);

    const enrichedCandidates: VendorSearchCandidate[] = [];

    for (const candidate of preRanked) {
      await randomDelay(300, 650);

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
      priceCents: pageData.priceCents ?? candidate.priceCents ?? null,
      rawText: mergedRawText,
      referenceNumbers: [...new Set(mergedRefs)],
      });
    }

    return enrichedCandidates;
  } catch (error) {
    console.error("Amazon candidate search failed:", error);
    return [];
  }
}