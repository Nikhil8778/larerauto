import * as cheerio from "cheerio";
import type { CandidateSearchInput, VendorSearchCandidate } from "./candidate-types";

function cleanText(value: string | undefined | null) {
  return (value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string) {
  return cleanText(value).toLowerCase();
}

function parsePriceToCents(priceText: string) {
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;

  return Math.round(amount * 100);
}

function buildSearchUrl(input: CandidateSearchInput) {
  const query = [input.year, input.make, input.model, input.engine, input.partType]
    .filter(Boolean)
    .join(" ");

  return `https://ca.a-premium.com/search?keyword=${encodeURIComponent(query)}`;
}

function trimTitle(title: string, max = 180) {
  const cleaned = cleanText(title);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trim()}...`;
}

function seemsRelevant(title: string, partType: string) {
  const t = normalize(title);
  const p = normalize(partType);

  if (p.includes("alternator")) {
    return (
      t.includes("alternator") &&
      !t.includes("starter") &&
      !t.includes("regulator") &&
      !t.includes("voltage regulator")
    );
  }

  if (p.includes("brake pad")) {
    return (
      t.includes("brake") &&
      t.includes("pad") &&
      !t.includes("rotor only") &&
      !t.includes("shoe") &&
      !t.includes("caliper")
    );
  }

  if (p.includes("rotor")) {
    return (
      (t.includes("rotor") || t.includes("disc brake rotor")) &&
      !t.includes("pad only") &&
      !t.includes("caliper")
    );
  }

  if (p.includes("starter")) {
    return t.includes("starter") && !t.includes("alternator");
  }

  if (p.includes("fuel tank")) {
    return (
      (t.includes("fuel tank") || t.includes("gas tank")) &&
      !t.includes("cap") &&
      !t.includes("strap") &&
      !t.includes("filler") &&
      !t.includes("pump") &&
      !t.includes("sending unit") &&
      !t.includes("sensor") &&
      !t.includes("reservoir")
    );
  }

  if (p.includes("spark plug")) {
    return t.includes("spark plug");
  }

  if (p.includes("radiator")) {
    return t.includes("radiator");
  }

  if (p.includes("control arm")) {
    return t.includes("control arm");
  }

  return t.includes(p);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickCard(linkNode: cheerio.Cheerio<any>) {
  const article = linkNode.closest("article");
  if (article.length) return article;

  const li = linkNode.closest("li");
  if (li.length) return li;

  const productContainer =
    linkNode.closest('[class*="product"]');
  if (productContainer.length) return productContainer;

  return linkNode.parent();
}

function extractTitle(card: cheerio.Cheerio<any>, linkNode: cheerio.Cheerio<any>) {
  const candidates = [
    cleanText(card.find("h1").first().text()),
    cleanText(card.find("h2").first().text()),
    cleanText(card.find("h3").first().text()),
    cleanText(card.find("h4").first().text()),
    cleanText(linkNode.find("img[alt]").first().attr("alt")),
    cleanText(card.find("img[alt]").first().attr("alt")),
    cleanText(linkNode.text()),
  ].filter(Boolean);

  const best =
    candidates.find((v) => v.length > 12 && !/^add to cart$/i.test(v)) ?? "";

  return trimTitle(best);
}

function extractPriceText(card: cheerio.Cheerio<any>) {
  const cardText = cleanText(card.text());

  const patterns = [
    /CA\$\s*\d{1,5}(?:[.,]\d{2})?/i,
    /\$\s*\d{1,5}(?:[.,]\d{2})?/i,
  ];

  for (const pattern of patterns) {
    const m = cardText.match(pattern);
    if (m) return m[0];
  }

  return "";
}

export async function searchAPremiumCandidates(
  input: CandidateSearchInput
): Promise<VendorSearchCandidate[]> {
  const url = buildSearchUrl(input);

  try {
    console.log("A-Premium URL:", url);

    await sleep(1500);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-CA,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://ca.a-premium.com/",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.log("A-Premium non-OK status:", res.status);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const candidates: VendorSearchCandidate[] = [];
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();

    $('a[href*="/product/"]').each((_, el) => {
      if (candidates.length >= 8) return false;

      const linkNode = $(el);
      const href = linkNode.attr("href");
      if (!href) return;

      const productUrl = href.startsWith("http")
        ? href
        : `https://ca.a-premium.com${href}`;

      const card = pickCard(linkNode);
      const rawText = cleanText(card.text());

      const title = extractTitle(card, linkNode);
      if (!title || title.length < 8) return;
      if (!seemsRelevant(title, input.partType)) return;

      const normalizedUrl = productUrl.toLowerCase();
      const normalizedTitle = title.toLowerCase();

      if (seenUrls.has(normalizedUrl)) return;
      if (seenTitles.has(normalizedTitle)) return;

      const priceText = extractPriceText(card);
      const priceCents = parsePriceToCents(priceText);

      seenUrls.add(normalizedUrl);
      seenTitles.add(normalizedTitle);

      candidates.push({
        vendor: "apremium",
        title,
        productUrl,
        priceCents,
        badge: null,
        inStock: /out of stock/i.test(rawText) ? false : true,
        rawText: rawText.slice(0, 2500),
      });
    });

    console.log("A-Premium candidates found:", candidates.length);
    console.log(
      "A-Premium candidate titles:",
      candidates.map((c) => ({
        title: c.title,
        priceCents: c.priceCents,
        productUrl: c.productUrl,
      }))
    );

    return candidates;
  } catch (err) {
    console.error("A-Premium scrape failed", err);
    return [];
  }
}