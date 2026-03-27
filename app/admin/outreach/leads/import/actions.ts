"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function normalize(value: string | undefined) {
  const v = (value || "").trim();
  return v ? v : null;
}

function parseNumber(value: string | undefined) {
  const v = (value || "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((cell) => cell.trim());
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

export async function importWorkshopLeadsCsv(formData: FormData) {
  const file = formData.get("csvFile");

  if (!(file instanceof File)) {
    throw new Error("CSV file is required.");
  }

  const text = await file.text();
  const rows = parseCsv(text);

  let inserted = 0;

  for (const row of rows) {
    const shopName = (row.shopName || "").trim();
    if (!shopName) continue;

    await prisma.workshopLead.create({
      data: {
        shopName,
        contactName: normalize(row.contactName),
        phone: normalize(row.phone),
        whatsappNumber: normalize(row.whatsappNumber),
        email: normalize(row.email),
        website: normalize(row.website),
        addressLine1: normalize(row.addressLine1),
        city: normalize(row.city),
        province: normalize(row.province) || "Ontario",
        postalCode: normalize(row.postalCode),
        googleMapsUrl: normalize(row.googleMapsUrl),
        category: normalize(row.category),
        rating: parseNumber(row.rating),
        reviewCount: parseNumber(row.reviewCount),
        source: normalize(row.source) || "csv",
        status: normalize(row.status) || "new",
        notes: normalize(row.notes),
        scrapedAt: null,
      },
    });

    inserted += 1;
  }

  revalidatePath("/admin/outreach/leads");
  revalidatePath("/admin/outreach/leads/import");

  return { inserted };
}