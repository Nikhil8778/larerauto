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
      String(lead.facebookPageUrl || "").toLowerCase().trim(),
      String(lead.city || "").toLowerCase().trim(),
    ].join("|");

    if (!lead.shopName?.trim()) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(lead);
  }

  return result;
}

export function buildFacebookPageSearchUrls(input: {
  city: string;
  province: string;
  query: string;
  pages: number;
}) {
  const urls: string[] = [];
  const location = `${input.query} ${input.city} ${input.province}`;

  for (let page = 0; page < input.pages; page += 1) {
    urls.push(
      `https://www.facebook.com/search/pages?q=${encodeURIComponent(location)}`
    );
  }

  return urls;
}

export function parseFacebookPageListings(
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

  $("a, div").each((_, el) => {
    const node = $(el);
    const text = cleanText(node.text());
    if (!text) return;

    const href = node.attr("href");
    const pageUrl =
      href && href.includes("facebook.com")
        ? absoluteUrl(href, "https://www.facebook.com")
        : null;

    const shopName =
      cleanText(node.find("strong").first().text()) ||
      cleanText(node.find("span").first().text()) ||
      cleanText(text.split("\n")[0]);

    if (!shopName || shopName.length < 3) return;
    if (!pageUrl) return;

    const phone = parsePhoneFromText(text);
    const hasWhatsappLink = /whatsapp/i.test(text);
    const hasMessengerLink = /message|messenger/i.test(text);

    leads.push({
      shopName,
      phone,
      whatsappNumber: hasWhatsappLink ? phone : null,
      city: defaults.city,
      province: defaults.province,
      category: defaults.category,
      source: "facebook_page",
      notes: "Imported via ZenRows Facebook Page scrape.",
      scrapedAt: new Date(),
      scrapePlatform: "zenrows_facebook_page",
      scrapeQuery: defaults.query,
      phoneSource: "social",
      outreachGoal: defaults.outreachGoal,
      adminNotes: defaults.adminNotes,
      facebookPageUrl: pageUrl,
      hasWhatsappLink,
      hasMessengerLink,
    });
  });

  return dedupeLeads(leads);
}