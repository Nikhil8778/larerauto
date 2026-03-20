import * as cheerio from "cheerio";
import type {
  CandidateSearchInput,
  VendorSearchCandidate,
} from "./candidate-types";

function cleanText(value: string | undefined | null) {
  return (value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePriceToCents(priceText: string) {
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const amount = Number(cleaned);
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

  if (
    [
      "DATANIMG",
      "BOXSIZING",
      "MINWIDTH",
      "MAXWIDTH",
      "MINHEIGHT",
      "MAXHEIGHT",
      "CODEYEAR",
      "CODE1YEAR",
      "CODE2YEAR",
      "CODE3YEAR",
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

  if (/^(19|20)\d{2}$/.test(v)) return false;
  if (/^(19|20)\d{6}$/.test(v)) return false;
  if (/^(19|20)\d{2}(19|20)\d{2}$/.test(v)) return false;

  if (!/[A-Z]\d{2,}/.test(v) && !/\d{5,}/.test(v)) {
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

function buildQueries(input: CandidateSearchInput) {
  const baseQueries = [
    [input.year, input.make, input.model, input.engine, input.partType]
      .filter(Boolean)
      .join(" "),
    [input.year, input.make, input.model, input.partType]
      .filter(Boolean)
      .join(" "),
    [input.make, input.model, input.engine, input.partType]
      .filter(Boolean)
      .join(" "),
    [input.make, input.model, input.partType].filter(Boolean).join(" "),
  ];

  const refQueries = (input.referenceNumbers ?? [])
    .map((ref) => normalizeRef(ref))
    .filter(isLikelyReferenceNumber)
    .slice(0, 3)
    .map((ref) => `${ref} ${input.partType}`);

  return [...new Set([...baseQueries, ...refQueries].filter(Boolean))];
}

function buildSearchUrl(query: string) {
  return `https://ca.a-premium.com/search?keyword=${encodeURIComponent(query)}`;
}

function normalizeTitle(title: string) {
  return cleanText(title)
    .replace(/^<img[^>]*alt="/i, "")
    .replace(/"[^"]*$/i, "")
    .replace(/\bfetchpriority\b.*$/i, "")
    .replace(/\bdecoding\b.*$/i, "")
    .replace(/\bloading\b.*$/i, "")
    .replace(/\bstyle\b.*$/i, "")
    .replace(/\bfit\b.*$/i, "")
    .replace(/\bsrc\b.*$/i, "")
    .replace(/\bdata-nimg\b.*$/i, "")
    .replace(/\bwidth\b.*$/i, "")
    .replace(/\bheight\b.*$/i, "")
    .replace(/\bA-PremiumPart #.*$/i, "")
    .replace(/\bEdit ZIP code.*$/i, "")
    .replace(/\b\d+-year warranty.*$/i, "")
    .replace(/\b\d+ days free return.*$/i, "")
    .replace(/\bAdd Trim and Engine info.*$/i, "")
    .replace(/\bBuy now.*$/i, "")
    .replace(/\bAdd to cart.*$/i, "")
    .replace(/\bShow less.*$/i, "")
    .trim();
}

function trimTitle(title: string, max = 140) {
  if (title.length <= max) return title;
  return `${title.slice(0, max).trim()}...`;
}

function seemsRelevant(title: string, partType: string) {
  const t = title.toLowerCase();
  const p = partType.toLowerCase();

  if (p.includes("alternator")) {
    return t.includes("alternator");
  }

  if (p.includes("brake pad")) {
    return (
      t.includes("brake") &&
      t.includes("pad") &&
      !t.includes("rotor only") &&
      !t.includes("shoe")
    );
  }

  if (p.includes("rotor")) {
    return t.includes("rotor") || t.includes("disc brake rotor");
  }

  if (p.includes("starter")) {
    return t.includes("starter");
  }

  if (p.includes("fuel tank")) {
    return (
      t.includes("fuel tank") &&
      !t.includes("cap") &&
      !t.includes("strap") &&
      !t.includes("filler") &&
      !t.includes("pump")
    );
  }

  return t.includes(p);
}

function randomDelay(minMs: number, maxMs: number) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function buildHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: "https://ca.a-premium.com/",
    Origin: "https://ca.a-premium.com",
    DNT: "1",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
  };
}

async function fetchWithRetry(url: string, attempts = 3) {
  let lastStatus: number | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const res = await fetch(url, {
      headers: buildHeaders(),
      cache: "no-store",
    });

    lastStatus = res.status;

    if (res.ok) {
      return res;
    }

    console.log(
      `A-Premium non-OK status: ${res.status} on attempt ${attempt}/${attempts} for ${url}`
    );

    if (attempt < attempts) {
      await randomDelay(2500, 5000);
    }
  }

  return new Response(null, { status: lastStatus ?? 500 });
}

export async function searchAPremiumCandidates(
  input: CandidateSearchInput
): Promise<VendorSearchCandidate[]> {
  const queries = buildQueries(input);
  const candidates: VendorSearchCandidate[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  try {
    for (const query of queries) {
      const url = buildSearchUrl(query);
      console.log("A-Premium query:", query);
      console.log("A-Premium URL:", url);

      await randomDelay(1500, 3000);

      const res = await fetchWithRetry(url, 3);

      if (!res.ok) {
        continue;
      }

      const html = await res.text();

      const blocked =
        /access denied/i.test(html) ||
        /forbidden/i.test(html) ||
        /captcha/i.test(html) ||
        /verify you are human/i.test(html);

      if (blocked) {
        console.log("A-Premium block page detected for query:", query);
        continue;
      }

      const $ = cheerio.load(html);

      $('a[href*="/product/"]').each((_, el) => {
        if (candidates.length >= 12) return false;

        const linkNode = $(el);
        const href = linkNode.attr("href");
        if (!href) return;

        const productUrl = href.startsWith("http")
          ? href
          : `https://ca.a-premium.com${href}`;

        const card =
          linkNode.closest("article").length
            ? linkNode.closest("article")
            : linkNode.closest("li").length
            ? linkNode.closest("li")
            : linkNode.closest("div");

        const rawText = cleanText(card.text());

        const imgAlt = cleanText(card.find("img[alt]").first().attr("alt"));
        const linkText = cleanText(linkNode.text());
        const headingText =
          cleanText(card.find("h1").first().text()) ||
          cleanText(card.find("h2").first().text()) ||
          cleanText(card.find("h3").first().text());

        let title = imgAlt || linkText || headingText || rawText;
        title = normalizeTitle(title);
        title = trimTitle(title, 140);

        if (!title || title.length < 8) return;
        if (!seemsRelevant(title, input.partType)) return;

        const normalizedUrl = productUrl.toLowerCase();
        const normalizedTitle = title.toLowerCase();

        if (seenUrls.has(normalizedUrl)) return;
        if (seenTitles.has(normalizedTitle)) return;

        seenUrls.add(normalizedUrl);
        seenTitles.add(normalizedTitle);

        const priceMatch =
          rawText.match(/CA\$\s*\d+[.,]?\d*/i) ||
          rawText.match(/\$\s*\d+[.,]?\d*/i);

        const priceText = priceMatch ? priceMatch[0] : "";
        const priceCents = parsePriceToCents(priceText);

        const referenceNumbers = extractReferenceNumbers(`${title} ${rawText}`);

        candidates.push({
          vendor: "apremium",
          title,
          productUrl,
          priceCents,
          badge: null,
          inStock: /out of stock/i.test(rawText) ? false : true,
          rawText: rawText.slice(0, 2500),
          referenceNumbers,
        });
      });

      if (candidates.length > 0) {
        break;
      }
    }

    console.log("A-Premium candidates found:", candidates.length);
    console.log(
      "A-Premium candidate titles:",
      candidates.map((c) => ({
        title: c.title,
        priceCents: c.priceCents,
        productUrl: c.productUrl,
        referenceNumbers: c.referenceNumbers,
      }))
    );

    return candidates;
  } catch (err) {
    console.error("A-Premium scrape failed", err);
    return [];
  }
}