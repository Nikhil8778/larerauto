"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SocialConnectionType, SocialPlatform } from "@prisma/client";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function createSocialChannel(formData: FormData) {
  const platform = formData.get("platform")?.toString() as SocialPlatform;
  const displayName = formData.get("displayName")?.toString().trim() || "";
  const handle = formData.get("handle")?.toString().trim() || null;
  const profileUrl = normalizeUrl(formData.get("profileUrl")?.toString() || "");
  const profileImageUrl =
    formData.get("profileImageUrl")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;
  const isActive = formData.get("isActive") === "on";

  if (!platform || !displayName || !profileUrl) {
    throw new Error("Platform, display name, and profile URL are required.");
  }

  await prisma.socialChannel.create({
    data: {
      platform,
      displayName,
      handle,
      profileUrl,
      profileImageUrl,
      notes,
      isActive,
      connectionType: SocialConnectionType.MANUAL,
    },
  });

  revalidatePath("/admin/marketing/channels");
}

export async function toggleSocialChannel(id: string, nextValue: boolean) {
  await prisma.socialChannel.update({
    where: { id },
    data: { isActive: nextValue },
  });

  revalidatePath("/admin/marketing/channels");
}

export async function deleteSocialChannel(id: string) {
  await prisma.socialChannel.delete({
    where: { id },
  });

  revalidatePath("/admin/marketing/channels");
}