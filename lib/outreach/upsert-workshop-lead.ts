import { prisma } from "@/lib/prisma";
import type {
  WorkshopScrapeInput,
  WorkshopScrapeResultRow,
} from "./workshop-scrape-types";

function cleanText(value: unknown) {
  const str = String(value ?? "").trim();
  return str || null;
}

function cleanPhone(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/[^\d+]/g, "");

  if (!normalized) return null;

  if (normalized.startsWith("+")) return normalized;
  if (normalized.length === 10) return normalized;
  if (normalized.length === 11 && normalized.startsWith("1")) return normalized;

  return normalized;
}

function cleanEmail(value: unknown) {
  const str = String(value ?? "").trim().toLowerCase();
  return str || null;
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

function normalizeShopName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function findExistingLead(input: {
  shopName: string;
  city?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
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

  const shopName = normalizeShopName(input.shopName);
  if (shopName) {
    const byShopCity = await prisma.workshopLead.findFirst({
      where: {
        shopName: {
          equals: shopName,
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

    if (byShopCity) return byShopCity;
  }

  return null;
}

export async function upsertWorkshopLead(
  rawLead: WorkshopScrapeInput,
  defaults?: {
    city?: string;
    province?: string;
    category?: string;
    source?: string;
  }
): Promise<WorkshopScrapeResultRow> {
  const shopName = normalizeShopName(String(rawLead.shopName ?? "").trim());

  if (!shopName) {
    return {
      shopName: "",
      status: "skipped",
      reason: "Missing shopName.",
    };
  }

  const phone = cleanPhone(rawLead.phone);
  const whatsappNumber = cleanPhone(rawLead.whatsappNumber);
  const email = cleanEmail(rawLead.email);
  const city = cleanText(rawLead.city) || cleanText(defaults?.city);
  const province = cleanText(rawLead.province) || cleanText(defaults?.province) || "Ontario";
  const category = cleanText(rawLead.category) || cleanText(defaults?.category);
  const source = cleanText(rawLead.source) || cleanText(defaults?.source) || "scrape";

  const data = {
    shopName,
    contactName: cleanText(rawLead.contactName),
    phone,
    whatsappNumber,
    email,
    website: cleanText(rawLead.website),
    addressLine1: cleanText(rawLead.addressLine1),
    city,
    province,
    postalCode: cleanText(rawLead.postalCode),
    googleMapsUrl: cleanText(rawLead.googleMapsUrl),
    category,
    rating: cleanNumber(rawLead.rating),
    reviewCount: cleanNumber(rawLead.reviewCount),
    source,
    notes: cleanText(rawLead.notes),
    scrapedAt: cleanDate(rawLead.scrapedAt) || new Date(),
    status: "new",
  };

  const existing = await findExistingLead({
    shopName,
    city,
    phone,
    whatsappNumber,
    email,
  });

  if (!existing) {
    const created = await prisma.workshopLead.create({
      data,
      select: { id: true, shopName: true },
    });

    return {
      shopName: created.shopName,
      status: "created",
      leadId: created.id,
    };
  }

  const current = await prisma.workshopLead.findUnique({
    where: { id: existing.id },
  });

  if (!current) {
    return {
      shopName,
      status: "skipped",
      reason: "Existing lead reference not found.",
    };
  }

  const updated = await prisma.workshopLead.update({
    where: { id: current.id },
    data: {
      contactName: data.contactName || current.contactName,
      phone: data.phone || current.phone,
      whatsappNumber: data.whatsappNumber || current.whatsappNumber,
      email: data.email || current.email,
      website: data.website || current.website,
      addressLine1: data.addressLine1 || current.addressLine1,
      city: data.city || current.city,
      province: data.province || current.province,
      postalCode: data.postalCode || current.postalCode,
      googleMapsUrl: data.googleMapsUrl || current.googleMapsUrl,
      category: data.category || current.category,
      rating: data.rating ?? current.rating,
      reviewCount: data.reviewCount ?? current.reviewCount,
      source: data.source || current.source,
      notes: data.notes || current.notes,
      scrapedAt: data.scrapedAt || current.scrapedAt,
    },
    select: { id: true, shopName: true },
  });

  return {
    shopName: updated.shopName,
    status: "updated",
    leadId: updated.id,
  };
}