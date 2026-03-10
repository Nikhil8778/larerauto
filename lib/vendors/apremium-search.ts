import * as cheerio from "cheerio";
import type { CandidateSearchInput, VendorSearchCandidate } from "./candidate-types";

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

function buildSearchUrl(input: CandidateSearchInput) {
  const query = [input.year, input.make, input.model, input.partType]
    .filter(Boolean)
    .join(" ");

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

function seemsRelevant(title: string, partType: string) {
  const t = title.toLowerCase();
  const p = partType.toLowerCase();

  if (p.includes("alternator")) return t.includes("alternator");
  if (p.includes("brake pad")) return t.includes("brake") && t.includes("pad");
  if (p.includes("rotor")) return t.includes("rotor");
  if (p.includes("starter")) return t.includes("starter");
  if (p.includes("fuel tank")) return t.includes("fuel tank");
  if (p.includes("spark plug")) return t.includes("spark plug");

  return t.includes(p);
}

export async function searchAPremiumCandidates(
  input: CandidateSearchInput
): Promise<VendorSearchCandidate[]> {
  const url = buildSearchUrl(input);

  try {
    console.log("A-Premium URL:", url);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-CA,en;q=0.9",
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
      if (candidates.length >= 5) return false;

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

      candidates.push({
        vendor: "apremium",
        title,
        productUrl,
        priceCents,
        badge: null,
        inStock: /out of stock/i.test(rawText) ? false : true,
        rawText: rawText.slice(0, 2000),
      });
    });

    console.log("A-Premium candidates found:", candidates.length);
    console.log(
      "A-Premium candidate titles:",
      candidates.map((c) => c.title)
    );

    return candidates;
  } catch (err) {
    console.error("A-Premium scrape failed", err);
    return [];
  }
}