import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { upsertWorkshopLead } from "@/lib/outreach/upsert-workshop-lead";
import type {
  WorkshopLeadScrapeInput,
  WorkshopScrapeRequest,
  WorkshopScrapeSaveResult,
} from "@/lib/outreach/workshop-scrape-types";

const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;

const SUPPORTED_SOURCES = ["zenrows_yellowpages", "zenrows_yelp"] as const;

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

function splitList(values: unknown): string[] {
  if (!values) return [];

  if (Array.isArray(values)) {
    return values
      .map((v) => cleanText(String(v)))
      .filter((v): v is string => !!v);
  }

  return String(values)
    .split(/\r?\n|,/)
    .map((v) => cleanText(v))
    .filter((v): v is string => !!v);
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

function normalizeKey(value: string | null | undefined) {
  return String(value || "").toLowerCase().trim();
}

function dedupeLeads(leads: WorkshopLeadScrapeInput[]) {
  const seen = new Set<string>();
  const result: WorkshopLeadScrapeInput[] = [];

  for (const lead of leads) {
    const emailKey = normalizeKey(lead.email);
    const phoneKey = normalizeKey(lead.phone || lead.whatsappNumber);
    const shopCityKey = `${normalizeKey(lead.shopName)}|${normalizeKey(lead.city)}`;

    const key = emailKey
      ? `email|${emailKey}`
      : phoneKey
      ? `phone|${phoneKey}`
      : `shopcity|${shopCityKey}`;

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

function buildYelpSearchUrls(input: {
  city: string;
  province: string;
  query: string;
  pages: number;
}) {
  const urls: string[] = [];
  const location = `${input.city}, ${input.province}`;

  for (let page = 0; page < input.pages; page += 1) {
    urls.push(
      `https://www.yelp.ca/search?find_desc=${encodeURIComponent(
        input.query
      )}&find_loc=${encodeURIComponent(location)}&start=${page * 10}`
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
    query: string;
    outreachGoal: string;
    adminNotes: string | null;
  }
): WorkshopLeadScrapeInput[] {
  const $ = cheerio.load(html);
  const leads: WorkshopLeadScrapeInput[] = [];

  const nodes = $(".listing, [data-business-id], .listing__content, .listing__result");

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
      absoluteUrl(node.find(".mlr__item--website a").first().attr("href"), "https://www.yellowpages.ca") ||
      absoluteUrl(node.find('a[href*="http"]').first().attr("href"), "https://www.yellowpages.ca");

    const addressLine1 =
      cleanText(node.find(".listing__address").first().text()) ||
      cleanText(node.find(".street-address").first().text()) ||
      cleanText(node.find("[itemprop='address']").first().text());

    const googleMapsUrl =
      absoluteUrl(node.find('a[href*="maps"]').first().attr("href"), "https://www.yellowpages.ca") || null;

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
      source: "yellowpages",
      notes: "Imported via ZenRows Yellow Pages scrape.",
      scrapedAt: new Date(),
      scrapePlatform: "zenrows_yellowpages",
      scrapeQuery: defaults.query,
      phoneSource: "directory",
      outreachGoal: defaults.outreachGoal,
      adminNotes: defaults.adminNotes,
    });
  });

  return dedupeLeads(leads);
}

function parseYelpListings(
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

  $("li").each((_, el) => {
    const node = $(el);

    const shopName =
      cleanText(node.find('a[href*="/biz/"] span').first().text()) ||
      cleanText(node.find('a[href*="/biz/"]').first().text()) ||
      cleanText(node.find("h3").first().text()) ||
      cleanText(node.find("h4").first().text());

    if (!shopName) return;

    const fullText = cleanText(node.text());
    if (!fullText) return;

    const phone = parsePhoneFromText(fullText);

    const website =
      absoluteUrl(node.find('a[href*="biz_redir"]').first().attr("href"), "https://www.yelp.ca") ||
      null;

    const addressLine1 =
      cleanText(node.find("address").first().text()) ||
      cleanText(node.find('[data-testid="address"]').first().text()) ||
      null;

    const rating =
      parseRating(
        cleanText(node.find('[aria-label*="star rating"]').first().attr("aria-label")) ||
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
      category: defaults.category,
      rating,
      reviewCount,
      source: "yelp",
      notes: "Imported via ZenRows Yelp scrape.",
      scrapedAt: new Date(),
      scrapePlatform: "zenrows_yelp",
      scrapeQuery: defaults.query,
      phoneSource: "directory",
      outreachGoal: defaults.outreachGoal,
      adminNotes: defaults.adminNotes,
    });
  });

  return dedupeLeads(leads);
}

function scoreLead(
  lead: WorkshopLeadScrapeInput,
  request: Required<
    Pick<
      WorkshopScrapeRequest,
      | "requirePhone"
      | "requireWebsite"
      | "requireEmail"
      | "preferDirectPhone"
      | "allowVirtualNumbers"
      | "preferWhatsappCapable"
      | "minimumReviews"
      | "minimumRating"
      | "outreachGoal"
    >
  >
) {
  let score = 0;

  if (lead.scrapePlatform === "zenrows_yellowpages") score += 48;
  if (lead.scrapePlatform === "zenrows_yelp") score += 45;

  if (lead.phone) score += 18;
  if (lead.website) score += 18;
  if (lead.email) score += 16;
  if (lead.addressLine1) score += 8;

  if ((lead.reviewCount ?? 0) >= 5) score += 8;
  if ((lead.reviewCount ?? 0) >= 20) score += 8;
  if ((lead.rating ?? 0) >= 3.5) score += 8;
  if ((lead.rating ?? 0) >= 4.2) score += 8;

  if (request.preferWhatsappCapable && lead.whatsappNumber) score += 6;
  if (request.preferDirectPhone && lead.phoneSource === "direct") score += 10;

  if (request.requirePhone && !lead.phone) score -= 40;
  if (request.requireWebsite && !lead.website) score -= 30;
  if (request.requireEmail && !lead.email) score -= 25;

  if ((lead.reviewCount ?? 0) < request.minimumReviews) score -= 18;
  if ((lead.rating ?? 0) < request.minimumRating) score -= 18;

  if (request.outreachGoal === "whatsapp" && !lead.phone) score -= 25;
  if (request.outreachGoal === "sms" && !lead.phone) score -= 25;
  if (request.outreachGoal === "email" && !lead.email) score -= 25;
  if (request.outreachGoal === "call" && !lead.phone) score -= 25;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function qualityFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function textMatchesRules(
  lead: WorkshopLeadScrapeInput,
  includeKeywords: string[],
  excludeKeywords: string[]
) {
  const text = [
    lead.shopName,
    lead.category,
    lead.addressLine1,
    lead.website,
    lead.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    includeKeywords.length > 0 &&
    !includeKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
  ) {
    return false;
  }

  if (
    excludeKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
  ) {
    return false;
  }

  return true;
}

function passesHardFilters(
  lead: WorkshopLeadScrapeInput,
  params: {
    requirePhone: boolean;
    requireWebsite: boolean;
    requireEmail: boolean;
    minimumReviews: number;
    minimumRating: number;
    allowVirtualNumbers: boolean;
  }
) {
  if (params.requirePhone && !lead.phone) return false;
  if (params.requireWebsite && !lead.website) return false;
  if (params.requireEmail && !lead.email) return false;
  if ((lead.reviewCount ?? 0) < params.minimumReviews) return false;
  if ((lead.rating ?? 0) < params.minimumRating) return false;

  if (params.allowVirtualNumbers === false && lead.isVirtualPhone === true) {
    return false;
  }

  return true;
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
    const primaryQuery = cleanText(body.query) || "auto body shop";
    const pagesRaw = Number(body.pages ?? 2);
    const pages = Number.isFinite(pagesRaw) ? Math.max(1, Math.min(20, pagesRaw)) : 2;

    const sources =
      Array.isArray(body.sources) && body.sources.length > 0
        ? body.sources
        : ["zenrows_yellowpages"];

    const alternateQueries = splitList(body.alternateQueries);
    const includeKeywords = splitList(body.includeKeywords);
    const excludeKeywords = splitList(body.excludeKeywords);

    const queryList = dedupeLeads(
      [primaryQuery, ...alternateQueries]
        .map((query) => ({ shopName: query }))
    ).map((x) => x.shopName);

    const requirePhone = Boolean(body.requirePhone);
    const requireWebsite = Boolean(body.requireWebsite);
    const requireEmail = Boolean(body.requireEmail);
    const preferDirectPhone = Boolean(body.preferDirectPhone);
    const allowVirtualNumbers =
      typeof body.allowVirtualNumbers === "boolean" ? body.allowVirtualNumbers : true;
    const preferWhatsappCapable = Boolean(body.preferWhatsappCapable);

    const minimumReviews = Math.max(0, Number(body.minimumReviews ?? 0) || 0);
    const minimumRating = Math.max(0, Number(body.minimumRating ?? 0) || 0);
    const maxItemsPerSource = Math.max(10, Math.min(300, Number(body.maxItemsPerSource ?? 100) || 100));

    const outreachGoal = body.outreachGoal || "mixed";
    const adminNotes = cleanText(body.adminNotes);

    const unsupportedSources = sources.filter(
      (source) => !SUPPORTED_SOURCES.includes(source as (typeof SUPPORTED_SOURCES)[number])
    );

    const scrapedLeads: WorkshopLeadScrapeInput[] = [];

    for (const source of sources) {
      if (!SUPPORTED_SOURCES.includes(source as (typeof SUPPORTED_SOURCES)[number])) {
        continue;
      }

      for (const query of queryList) {
        let urls: string[] = [];

        if (source === "zenrows_yellowpages") {
          urls = buildYellowPagesSearchUrls({
            city,
            province,
            query,
            pages,
          });
        }

        if (source === "zenrows_yelp") {
          urls = buildYelpSearchUrls({
            city,
            province,
            query,
            pages,
          });
        }

        let sourceCount = 0;

        for (const url of urls) {
          if (sourceCount >= maxItemsPerSource) break;

          const html = await fetchViaZenRows(url, true);

          let parsed: WorkshopLeadScrapeInput[] = [];

          if (source === "zenrows_yellowpages") {
            parsed = parseYellowPagesListings(html, {
              city,
              province,
              category,
              query,
              outreachGoal,
              adminNotes,
            });
          }

          if (source === "zenrows_yelp") {
            parsed = parseYelpListings(html, {
              city,
              province,
              category,
              query,
              outreachGoal,
              adminNotes,
            });
          }

          const enriched = parsed.map((lead) => {
            const score = scoreLead(lead, {
              requirePhone,
              requireWebsite,
              requireEmail,
              preferDirectPhone,
              allowVirtualNumbers,
              preferWhatsappCapable,
              minimumReviews,
              minimumRating,
              outreachGoal,
            });

            const contactQuality = qualityFromScore(score);

            return {
              ...lead,
              leadScore: score,
              contactQuality,
            };
          });

          const filtered = enriched.filter(
            (lead) =>
              textMatchesRules(lead, includeKeywords, excludeKeywords) &&
              passesHardFilters(lead, {
                requirePhone,
                requireWebsite,
                requireEmail,
                minimumReviews,
                minimumRating,
                allowVirtualNumbers,
              })
          );

          scrapedLeads.push(...filtered);
          sourceCount += filtered.length;
        }
      }
    }

    const deduped = dedupeLeads(scrapedLeads).sort(
      (a, b) => Number(b.leadScore || 0) - Number(a.leadScore || 0)
    );

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
          platform: lead.scrapePlatform || lead.source || undefined,
          leadScore: lead.leadScore ?? null,
          contactQuality: lead.contactQuality ?? null,
        });
      } catch (error) {
        result.skipped += 1;
        result.items.push({
          shopName: lead.shopName,
          status: "skipped",
          reason: error instanceof Error ? error.message : "Save failed",
          platform: lead.scrapePlatform || lead.source || undefined,
          leadScore: lead.leadScore ?? null,
          contactQuality: lead.contactQuality ?? null,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      query: primaryQuery,
      city,
      province,
      category,
      pages,
      selectedSources: sources,
      supportedSources: SUPPORTED_SOURCES,
      unsupportedSources,
      queryList,
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
    supportedSources: SUPPORTED_SOURCES,
  });
}