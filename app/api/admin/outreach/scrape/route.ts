import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { upsertWorkshopLead } from "@/lib/outreach/upsert-workshop-lead";
import type {
  WorkshopLeadScrapeInput,
  WorkshopScrapeRequest,
  WorkshopScrapeSaveResult,
} from "@/lib/outreach/workshop-scrape-types";

const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;

function buildZenRowsUrl(targetUrl: string, jsRender = false) {
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

async function fetchViaZenRows(targetUrl: string, jsRender = false) {
  const url = buildZenRowsUrl(targetUrl, jsRender);

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`ZenRows request failed with ${res.status}`);
  }

  return res.text();
}

function cleanText(value: string | undefined | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parsePhone(text: string) {
  const m = text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return m ? cleanText(m[0]) : null;
}

function parseRating(text: string) {
  const m = text.match(/([0-9]\.?[0-9]?)\s*(?:stars?|star|\/5)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseReviewCount(text: string) {
  const m = text.match(/\(?([\d,]+)\)?\s*reviews?/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function extractDomainWebsite(text: string) {
  const m = text.match(
    /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/
  );
  if (!m) return null;

  let url = m[0].trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
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

  $(".listing, .result, .search-result, .listing__content").each((_, el) => {
    const node = $(el);

    const shopName =
      cleanText(node.find("h2").first().text()) ||
      cleanText(node.find("h3").first().text()) ||
      cleanText(node.find(".listing__name").first().text()) ||
      cleanText(node.find(".business-name").first().text());

    if (!shopName) return;

    const fullText = cleanText(node.text());

    const phone =
      cleanText(node.find('a[href^="tel:"]').first().text()) || parsePhone(fullText);

    const websiteHref =
      node.find('a[href*="http"]').first().attr("href") ||
      extractDomainWebsite(fullText);

    const addressLine1 =
      cleanText(node.find(".listing__address").first().text()) ||
      cleanText(node.find(".street-address").first().text());

    const rating =
      parseRating(
        cleanText(node.find('[aria-label*="star"]').first().attr("aria-label")) ||
          fullText
      ) ?? null;

    const reviewCount = parseReviewCount(fullText);

    leads.push({
      shopName,
      phone,
      website: websiteHref || null,
      addressLine1,
      city: defaults.city,
      province: defaults.province,
      category: defaults.category,
      rating,
      reviewCount,
      source: defaults.source,
      notes: "Imported via ZenRows body shop scrape.",
      scrapedAt: new Date(),
    });
  });

  return dedupeLeads(leads);
}

function dedupeLeads(leads: WorkshopLeadScrapeInput[]) {
  const seen = new Set<string>();
  const out: WorkshopLeadScrapeInput[] = [];

  for (const lead of leads) {
    const key = [
      String(lead.shopName || "").toLowerCase().trim(),
      String(lead.phone || "").toLowerCase().trim(),
      String(lead.city || "").toLowerCase().trim(),
    ].join("|");

    if (!lead.shopName || seen.has(key)) continue;
    seen.add(key);
    out.push(lead);
  }

  return out;
}

function buildYellowPagesSearchUrls(input: {
  city: string;
  province: string;
  category: string;
  pages: number;
}) {
  const urls: string[] = [];
  const location = `${input.city}, ${input.province}`;
  const what = input.category;

  for (let page = 1; page <= input.pages; page += 1) {
    const url = new URL("https://www.yellowpages.ca/search/si/1/");
    url.pathname = `/search/si/${page}/${encodeURIComponent(what)}/${encodeURIComponent(
      location
    )}`;
    urls.push(url.toString());
  }

  return urls;
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

    const city = String(body.city || "Greater Sudbury").trim();
    const province = String(body.province || "Ontario").trim();
    const category = String(body.category || "Body Shop").trim();
    const pages = Math.max(1, Math.min(Number(body.pages || 2), 10));
    const source = String(body.source || "zenrows_yellowpages").trim();

    const urls = buildYellowPagesSearchUrls({
      city,
      province,
      category: body.query?.trim() || `${category}`,
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
      const status = await upsertWorkshopLead(lead);

      if (status === "created") result.created += 1;
      if (status === "updated") result.updated += 1;
      if (status === "skipped") result.skipped += 1;

      result.items.push({
        shopName: lead.shopName,
        status,
      });
    }

    return NextResponse.json({
      ok: true,
      query: body.query || category,
      city,
      province,
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