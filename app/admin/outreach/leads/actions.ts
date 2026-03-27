"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

export async function createWorkshopLead(formData: FormData) {
  const shopName = String(formData.get("shopName") ?? "").trim();

  if (!shopName) {
    throw new Error("Shop name is required.");
  }

  await prisma.workshopLead.create({
    data: {
      shopName,
      contactName: emptyToNull(formData.get("contactName")),
      phone: emptyToNull(formData.get("phone")),
      whatsappNumber: emptyToNull(formData.get("whatsappNumber")),
      email: emptyToNull(formData.get("email")),
      website: emptyToNull(formData.get("website")),
      addressLine1: emptyToNull(formData.get("addressLine1")),
      city: emptyToNull(formData.get("city")),
      province: emptyToNull(formData.get("province")) || "Ontario",
      postalCode: emptyToNull(formData.get("postalCode")),
      googleMapsUrl: emptyToNull(formData.get("googleMapsUrl")),
      category: emptyToNull(formData.get("category")),
      rating: numberOrNull(formData.get("rating")),
      reviewCount: numberOrNull(formData.get("reviewCount")),
      source: emptyToNull(formData.get("source")) || "manual",
      status: emptyToNull(formData.get("status")) || "new",
      notes: emptyToNull(formData.get("notes")),
      scrapedAt: null,
    },
  });

  revalidatePath("/admin/outreach/leads");
}

export async function deleteWorkshopLead(id: string) {
  await prisma.workshopLead.delete({
    where: { id },
  });

  revalidatePath("/admin/outreach/leads");
}

export async function updateWorkshopLeadStatus(id: string, status: string) {
  await prisma.workshopLead.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/outreach/leads");
}