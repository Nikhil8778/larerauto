"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export async function createCampaign(formData: FormData) {
  const name = formData.get("name")?.toString().trim() || "";
  const objective = formData.get("objective")?.toString().trim() || null;
  const platform = formData.get("platform")?.toString().trim() || null;
  const audience = formData.get("audience")?.toString().trim() || null;
  const landingUrl = normalizeUrl(formData.get("landingUrl")?.toString() || "");
  const utmSource = formData.get("utmSource")?.toString().trim() || null;
  const utmMedium = formData.get("utmMedium")?.toString().trim() || null;
  const utmCampaign = formData.get("utmCampaign")?.toString().trim() || null;
  const status = formData.get("status")?.toString() as CampaignStatus;
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!name || !landingUrl || !status) {
    throw new Error("Name, landing URL, and status are required.");
  }

  await prisma.campaign.create({
    data: {
      name,
      objective,
      platform,
      audience,
      landingUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      status,
      notes,
    },
  });

  revalidatePath("/admin/marketing/campaigns");
}

export async function deleteCampaign(id: string) {
  await prisma.campaign.delete({
    where: { id },
  });

  revalidatePath("/admin/marketing/campaigns");
}