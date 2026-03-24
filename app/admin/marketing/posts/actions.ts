"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SocialPostStatus, SocialPostType } from "@prisma/client";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export async function createSocialPost(formData: FormData) {
  const channelId = formData.get("channelId")?.toString() || "";
  const campaignIdRaw = formData.get("campaignId")?.toString() || "";
  const campaignId = campaignIdRaw.trim() ? campaignIdRaw : null;

  const title = formData.get("title")?.toString().trim() || "";
  const caption = formData.get("caption")?.toString().trim() || "";
  const mediaUrl = normalizeUrl(formData.get("mediaUrl")?.toString() || "");
  const targetUrlInput = normalizeUrl(formData.get("targetUrl")?.toString() || "");
  const postType = formData.get("postType")?.toString() as SocialPostType;
  const status = formData.get("status")?.toString() as SocialPostStatus;
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!channelId || !title || !caption || !postType || !status) {
    throw new Error("Channel, title, caption, post type and status are required.");
  }

  let finalTargetUrl = targetUrlInput;

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error("Selected campaign not found.");
    }

    if (!finalTargetUrl) {
      finalTargetUrl = campaign.landingUrl;
    }
  }

  await prisma.socialPost.create({
    data: {
      channelId,
      campaignId,
      title,
      caption,
      mediaUrl,
      targetUrl: finalTargetUrl,
      postType,
      status,
      notes,
    },
  });

  revalidatePath("/admin/marketing/posts");
}

export async function deleteSocialPost(id: string) {
  await prisma.socialPost.delete({
    where: { id },
  });

  revalidatePath("/admin/marketing/posts");
}