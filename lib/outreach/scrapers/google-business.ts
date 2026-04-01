import * as cheerio from "cheerio";
import type { WorkshopLeadScrapeInput } from "@/lib/outreach/workshop-scrape-types";

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string | undefined | null) {
  const raw = cleanText(value);
  if (!raw) return null;

  const normalized = raw.replace(/[^\d+]/g, "");
  if (!normalized) return null;

  if (normalized.startsWith("+")) return normalized;
  if (normalized.length === 10) return normalized;
  if (normalized.length === 11 && normalized.startsWith("1")) return `+${normalized}`;

  return normalized;
}

function parsePhoneFromText(text: string) {
  const match = text.match(
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
  );
  return match ? normalizePhone(match[0]) : null;
}

function parseRating(text: string) {
  const match =
    text.match(/([0-9](?:\.[0-9])?)\s*(?:stars?|star|\/\s*5)/i) ||
    text.match(/rated\s*([0-9](?:\.[0-9])?)/i);

  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseReviewCount(text: string) {
  const match =
    text.match(/\(?([\d,]+)\)?\s*reviews?/i) ||
    text.match(/([\d,]+)\s*review/i);

  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function absoluteUrl(url: string | undefined | null, base: string) {
  const value = cleanText(url);
  if (!value) return null;

  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function dedupeLeads(leads: WorkshopLeadScrapeInput[]) {
  const seen = new Set<string>();
  const result: WorkshopLeadScrapeInput[] = [];

  for (const lead of leads) {
    const key = [
      String(lead.shopName || "").toLowerCase().trim(),
      String(lead.phone || "").toLowerCase().trim(),
      String(lead.city || "").toLowerCase().trim(),
    ].join("|");

    if (!lead.shopName?.trim()) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(lead);
  }

  return result;
}

export function buildGoogleBusinessSearchUrls(input: {
  city: string;
  province: string;
  query: string;
  pages: number;
}) {
  const urls: string[] = [];
  const location = `${input.query} ${input.city} ${input.province}`;

  for (let page = 0; page < input.pages; page += 1) {
    const start = page * 10;
    urls.push(
      `https://www.google.com/search?q=${encodeURIComponent(location)}&start=${start}`
    );
  }

  return urls;
}

export function parseGoogleBusinessListings(
  html: string,
  defaults: {
    city: string;
    province: string;
    category: string;
    query: string;
    outreachGoal: string;
    adminNotes: string | null;
  }
): WorkshopLeadScrapeInput[] {
  const $ = cheerio.load(html);
  const leads: WorkshopLeadScrapeInput[] = [];

  $("div, article").each((_, el) => {
    const node = $(el);
    const text = cleanText(node.text());
    if (!text) return;

    const shopName =
      cleanText(node.find("h3").first().text()) ||
      cleanText(node.find("h2").first().text()) ||
      cleanText(node.find('[role="heading"]').first().text());

    if (!shopName) return;
    if (shopName.length < 3) return;

    const phone = parsePhoneFromText(text);

    const website =
      absoluteUrl(node.find('a[href^="http"]').first().attr("href"), "https://www.google.com") ||
      null;

    const rating =
      parseRating(
        cleanText(node.find('[aria-label*="star"]').first().attr("aria-label")) || text
      ) ?? null;

    const reviewCount = parseReviewCount(text);

    leads.push({
      shopName,
      phone,
      whatsappNumber: phone,
      website,
      city: defaults.city,
      province: defaults.province,
      category: defaults.category,
      rating,
      reviewCount,
      source: "google_business",
      notes: "Imported via ZenRows Google Business scrape.",
      scrapedAt: new Date(),
      scrapePlatform: "zenrows_google_business",
      scrapeQuery: defaults.query,
      phoneSource: "direct",
      outreachGoal: defaults.outreachGoal,
      adminNotes: defaults.adminNotes,
      googleMapsUrl: null,
    });
  });

  return dedupeLeads(leads);
}