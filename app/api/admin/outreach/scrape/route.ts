import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { upsertWorkshopLead } from "@/lib/outreach/upsert-workshop-lead";
import type {
  WorkshopLeadScrapeInput,
  WorkshopScrapeRequest,
  WorkshopScrapeSaveResult,
} from "@/lib/outreach/workshop-scrape-types";

const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;

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
  const match = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
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
  const match = text.match(/\(?([\d,]+)\)?\s*reviews?/i);
  if (!match) return null;

  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function absoluteUrl(url: string | undefined | null, base = "https://www.yellowpages.ca") {
  const value = cleanText(url);
  if (!value) return null;

  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function buildZenRowsUrl(targetUrl: string, jsRender = true) {
  if (!ZENROWS_API_KEY) {
    throw new Error("ZENROWS_API_KEY is missing.");
  }

  const params = new URLSearchParams({
    apikey: ZENROWS_API_KEY,
    url: targetUrl,
    js_render: jsRender ? "true" : "false",
    premium_proxy: "true",
  });

  return `https://api.zenrows.com/v1/?${params.toString()}`;
}

async function fetchViaZenRows(targetUrl: string, jsRender = true) {
  const url = buildZenRowsUrl(targetUrl, jsRender);

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`ZenRows request failed (${res.status}): ${body || "Unknown error"}`);
  }

  return res.text();
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

function buildYellowPagesSearchUrls(input: {
  city: string;
  province: string;
  query: string;
  pages: number;
}) {
  const urls: string[] = [];
  const location = `${input.city}, ${input.province}`;

  for (let page = 1; page <= input.pages; page += 1) {
    urls.push(
      `https://www.yellowpages.ca/search/si/${page}/${encodeURIComponent(
        input.query
      )}/${encodeURIComponent(location)}`
    );
  }

  return urls;
}

function parseYellowPagesListings(
  html: string,
  defaults: {
    city: string;
    province: string;
    category: string;
    source: string;
  }
): WorkshopLeadScrapeInput[] {
  const $ = cheerio.load(html);
  const leads: WorkshopLeadScrapeInput[] = [];

  const listingSelectors = [
    ".listing",
    ".listing__content",
    ".result",
    ".search-result",
    ".listing__result",
    "[data-business-id]",
  ];

  const nodes = $(listingSelectors.join(","));

  nodes.each((_, el) => {
    const node = $(el);

    const shopName =
      cleanText(node.find("h2").first().text()) ||
      cleanText(node.find("h3").first().text()) ||
      cleanText(node.find(".listing__name").first().text()) ||
      cleanText(node.find(".business-name").first().text()) ||
      cleanText(node.find("[itemprop='name']").first().text());

    if (!shopName) return;

    const fullText = cleanText(node.text());

    const phone =
      normalizePhone(node.find('a[href^="tel:"]').first().text()) ||
      parsePhoneFromText(fullText);

    const website =
      absoluteUrl(node.find('a[href*="http"]').first().attr("href")) ||
      absoluteUrl(node.find(".mlr__item--website a").first().attr("href"));

    const addressLine1 =
      cleanText(node.find(".listing__address").first().text()) ||
      cleanText(node.find(".street-address").first().text()) ||
      cleanText(node.find("[itemprop='address']").first().text());

    const googleMapsUrl =
      absoluteUrl(node.find('a[href*="maps"]').first().attr("href")) || null;

    const rating =
      parseRating(
        cleanText(node.find('[aria-label*="star"]').first().attr("aria-label")) ||
          fullText
      ) ?? null;

    const reviewCount = parseReviewCount(fullText);

    leads.push({
      shopName,
      phone,
      whatsappNumber: phone,
      website,
      addressLine1,
      city: defaults.city,
      province: defaults.province,
      googleMapsUrl,
      category: defaults.category,
      rating,
      reviewCount,
      source: defaults.source,
      notes: "Imported via ZenRows directory scrape.",
      scrapedAt: new Date(),
    });
  });

  return dedupeLeads(leads);
}

export async function POST(req: NextRequest) {
  try {
    if (!ZENROWS_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "ZENROWS_API_KEY is missing." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as WorkshopScrapeRequest;

    const city = cleanText(body.city) || "Greater Sudbury";
    const province = cleanText(body.province) || "Ontario";
    const category = cleanText(body.category) || "Body Shop";
    const query = cleanText(body.query) || "auto body shop";
    const pagesRaw = Number(body.pages ?? 2);
    const pages = Number.isFinite(pagesRaw) ? Math.max(1, Math.min(10, pagesRaw)) : 2;
    const source = cleanText(body.source) || "zenrows_yellowpages";

    const urls = buildYellowPagesSearchUrls({
      city,
      province,
      query,
      pages,
    });

    const scrapedLeads: WorkshopLeadScrapeInput[] = [];

    for (const url of urls) {
      const html = await fetchViaZenRows(url, true);
      const parsed = parseYellowPagesListings(html, {
        city,
        province,
        category,
        source,
      });

      scrapedLeads.push(...parsed);
    }

    const deduped = dedupeLeads(scrapedLeads);

    const result: WorkshopScrapeSaveResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      total: deduped.length,
      items: [],
    };

    for (const lead of deduped) {
      try {
        const status = await upsertWorkshopLead(lead);

        if (status === "created") result.created += 1;
        if (status === "updated") result.updated += 1;
        if (status === "skipped") result.skipped += 1;

        result.items.push({
          shopName: lead.shopName,
          status,
        });
      } catch (error) {
        result.skipped += 1;
        result.items.push({
          shopName: lead.shopName,
          status: "skipped",
          reason: error instanceof Error ? error.message : "Save failed",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      query,
      city,
      province,
      category,
      pages,
      ...result,
    });
  } catch (error) {
    console.error("admin outreach scrape error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Scrape failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Use POST to scrape and save workshop leads.",
  });
}