import { prisma } from "@/lib/prisma";
import type { WorkshopLeadScrapeInput } from "./workshop-scrape-types";
import { classifyLeadChannels } from "./lead-channel-buckets";
import { evaluateLeadAuthenticity } from "./lead-authenticity";

function cleanText(value: unknown) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

function cleanEmail(value: unknown) {
  const str = String(value ?? "").trim().toLowerCase();
  return str || null;
}

function cleanPhone(value: unknown) {
  const str = String(value ?? "").trim();
  if (!str) return null;

  const normalized = str.replace(/[^\d+]/g, "");
  if (!normalized) return null;

  if (normalized.startsWith("+")) return normalized;
  if (normalized.length === 10) return normalized;
  if (normalized.length === 11 && normalized.startsWith("1")) return `+${normalized}`;

  return normalized;
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function cleanDate(value: unknown) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function findExistingLead(input: {
  shopName: string;
  city?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  facebookPageUrl?: string | null;
}) {
  if (input.email) {
    const byEmail = await prisma.workshopLead.findFirst({
      where: { email: input.email },
      select: { id: true },
    });
    if (byEmail) return byEmail;
  }

  if (input.whatsappNumber) {
    const byWhatsapp = await prisma.workshopLead.findFirst({
      where: { whatsappNumber: input.whatsappNumber },
      select: { id: true },
    });
    if (byWhatsapp) return byWhatsapp;
  }

  if (input.phone) {
    const byPhone = await prisma.workshopLead.findFirst({
      where: { phone: input.phone },
      select: { id: true },
    });
    if (byPhone) return byPhone;
  }

  if (input.facebookPageUrl) {
    const byFacebook = await prisma.workshopLead.findFirst({
      where: { facebookPageUrl: input.facebookPageUrl },
      select: { id: true },
    });
    if (byFacebook) return byFacebook;
  }

  const byShopCity = await prisma.workshopLead.findFirst({
    where: {
      shopName: {
        equals: input.shopName,
        mode: "insensitive",
      },
      ...(input.city
        ? {
            city: {
              equals: input.city,
              mode: "insensitive",
            },
          }
        : {}),
    },
    select: { id: true },
  });

  return byShopCity;
}

export async function upsertWorkshopLead(
  input: WorkshopLeadScrapeInput
): Promise<"created" | "updated" | "skipped"> {
  const shopName = cleanText(input.shopName);

  if (!shopName) {
    return "skipped";
  }

  const preNormalized = {
    shopName,
    contactName: cleanText(input.contactName),
    phone: cleanPhone(input.phone),
    whatsappNumber: cleanPhone(input.whatsappNumber),
    email: cleanEmail(input.email),
    website: cleanText(input.website),
    addressLine1: cleanText(input.addressLine1),
    city: cleanText(input.city),
    province: cleanText(input.province) || "Ontario",
    postalCode: cleanText(input.postalCode),
    googleMapsUrl: cleanText(input.googleMapsUrl),
    category: cleanText(input.category),
    rating: cleanNumber(input.rating),
    reviewCount: cleanNumber(input.reviewCount),
    source: cleanText(input.source) || "zenrows",
    notes: cleanText(input.notes),
    scrapedAt: cleanDate(input.scrapedAt) || new Date(),

    scrapePlatform: cleanText(input.scrapePlatform),
    scrapeQuery: cleanText(input.scrapeQuery),
    contactQuality: cleanText(input.contactQuality) as
      | "high"
      | "medium"
      | "low"
      | null,
    leadScore: cleanNumber(input.leadScore),
    phoneSource: cleanText(input.phoneSource),
    isVirtualPhone:
      typeof input.isVirtualPhone === "boolean" ? input.isVirtualPhone : null,
    outreachGoal: cleanText(input.outreachGoal),
    adminNotes: cleanText(input.adminNotes),

    facebookPageUrl: cleanText(input.facebookPageUrl),
    instagramPageUrl: cleanText(input.instagramPageUrl),
    hasWhatsappLink:
      typeof input.hasWhatsappLink === "boolean" ? input.hasWhatsappLink : false,
    hasMessengerLink:
      typeof input.hasMessengerLink === "boolean" ? input.hasMessengerLink : false,
    websiteContactUrl: cleanText(input.websiteContactUrl),
    authenticityTier: cleanText(input.authenticityTier) as
      | "high"
      | "medium"
      | "low"
      | null,
  };

  const channelFlags = classifyLeadChannels({
    phone: preNormalized.phone,
    whatsappNumber: preNormalized.whatsappNumber,
    email: preNormalized.email,
    website: preNormalized.website,
    facebookPageUrl: preNormalized.facebookPageUrl,
    instagramPageUrl: preNormalized.instagramPageUrl,
    hasWhatsappLink: preNormalized.hasWhatsappLink,
    hasMessengerLink: preNormalized.hasMessengerLink,
    isVirtualPhone: preNormalized.isVirtualPhone,
  });

  const authenticity = evaluateLeadAuthenticity({
    scrapePlatform: preNormalized.scrapePlatform,
    phone: preNormalized.phone,
    email: preNormalized.email,
    website: preNormalized.website,
    facebookPageUrl: preNormalized.facebookPageUrl,
    instagramPageUrl: preNormalized.instagramPageUrl,
    reviewCount: preNormalized.reviewCount,
    rating: preNormalized.rating,
    isVirtualPhone: preNormalized.isVirtualPhone,
    hasWhatsappLink: preNormalized.hasWhatsappLink,
    hasMessengerLink: preNormalized.hasMessengerLink,
  });

  const normalized = {
    ...preNormalized,
    bestContactChannel: channelFlags.bestContactChannel,
    isWhatsappQuality: channelFlags.isWhatsappQuality,
    isCallOnly: channelFlags.isCallOnly,
    isEmailQuality: channelFlags.isEmailQuality,
    isSocialOnly: channelFlags.isSocialOnly,
    leadScore: preNormalized.leadScore ?? authenticity.leadScore,
    contactQuality: preNormalized.contactQuality ?? authenticity.contactQuality,
    authenticityTier: preNormalized.authenticityTier ?? authenticity.authenticityTier,
  };

  const existing = await findExistingLead({
    shopName: normalized.shopName,
    city: normalized.city,
    phone: normalized.phone,
    whatsappNumber: normalized.whatsappNumber,
    email: normalized.email,
    facebookPageUrl: normalized.facebookPageUrl,
  });

  if (!existing) {
    await prisma.workshopLead.create({
      data: {
        ...normalized,
        status: "new",
      },
    });

    return "created";
  }

  await prisma.workshopLead.update({
    where: { id: existing.id },
    data: {
      contactName: normalized.contactName ?? undefined,
      phone: normalized.phone ?? undefined,
      whatsappNumber: normalized.whatsappNumber ?? undefined,
      email: normalized.email ?? undefined,
      website: normalized.website ?? undefined,
      addressLine1: normalized.addressLine1 ?? undefined,
      city: normalized.city ?? undefined,
      province: normalized.province ?? undefined,
      postalCode: normalized.postalCode ?? undefined,
      googleMapsUrl: normalized.googleMapsUrl ?? undefined,
      category: normalized.category ?? undefined,
      rating: normalized.rating ?? undefined,
      reviewCount: normalized.reviewCount ?? undefined,
      source: normalized.source ?? undefined,
      notes: normalized.notes ?? undefined,
      scrapedAt: normalized.scrapedAt ?? undefined,

      scrapePlatform: normalized.scrapePlatform ?? undefined,
      scrapeQuery: normalized.scrapeQuery ?? undefined,
      contactQuality: normalized.contactQuality ?? undefined,
      leadScore: normalized.leadScore ?? undefined,
      phoneSource: normalized.phoneSource ?? undefined,
      isVirtualPhone: normalized.isVirtualPhone ?? undefined,
      outreachGoal: normalized.outreachGoal ?? undefined,
      adminNotes: normalized.adminNotes ?? undefined,

      bestContactChannel: normalized.bestContactChannel ?? undefined,
      isWhatsappQuality: normalized.isWhatsappQuality,
      isCallOnly: normalized.isCallOnly,
      isEmailQuality: normalized.isEmailQuality,
      isSocialOnly: normalized.isSocialOnly,

      facebookPageUrl: normalized.facebookPageUrl ?? undefined,
      instagramPageUrl: normalized.instagramPageUrl ?? undefined,
      hasWhatsappLink: normalized.hasWhatsappLink,
      hasMessengerLink: normalized.hasMessengerLink,
      websiteContactUrl: normalized.websiteContactUrl ?? undefined,
      authenticityTier: normalized.authenticityTier ?? undefined,
    },
  });

  return "updated";
}