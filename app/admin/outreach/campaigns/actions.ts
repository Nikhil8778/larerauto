"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? str : null;
}

function intOrDefault(value: FormDataEntryValue | null, fallback: number) {
  const str = String(value ?? "").trim();
  const n = Number(str);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function boolFromForm(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function applyTemplateVars(
  body: string,
  params: {
    shopName?: string | null;
    contactName?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
  }
) {
  return body
    .replaceAll("{{shopName}}", params.shopName || "")
    .replaceAll("{{contactName}}", params.contactName || "")
    .replaceAll("{{city}}", params.city || "")
    .replaceAll("{{phone}}", params.phone || "")
    .replaceAll("{{email}}", params.email || "");
}

export async function createOutreachCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();

  if (!name) {
    throw new Error("Campaign name is required.");
  }

  if (!channel) {
    throw new Error("Campaign channel is required.");
  }

  await prisma.outreachCampaign.create({
    data: {
      name,
      channel,
      audience: emptyToNull(formData.get("audience")),
      templateId: emptyToNull(formData.get("templateId")),
      status: emptyToNull(formData.get("status")) || "draft",
      dailyLimit: intOrDefault(formData.get("dailyLimit"), 25),
      notes: emptyToNull(formData.get("notes")),
      filterCity: emptyToNull(formData.get("filterCity")),
      filterSource: emptyToNull(formData.get("filterSource")),
      filterLeadStatus: emptyToNull(formData.get("filterLeadStatus")) || "approved",
      requireWhatsapp: boolFromForm(formData.get("requireWhatsapp")),
      requireEmail: boolFromForm(formData.get("requireEmail")),
    },
  });

  revalidatePath("/admin/outreach/campaigns");
}

export async function deleteOutreachCampaign(id: string) {
  await prisma.outreachCampaign.delete({
    where: { id },
  });

  revalidatePath("/admin/outreach/campaigns");
}

export async function updateOutreachCampaignStatus(id: string, status: string) {
  await prisma.outreachCampaign.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/outreach/campaigns");
}

export async function queueCampaignMessages(campaignId: string) {
  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (!campaign.template) {
    throw new Error("Please attach a template to this campaign before queueing.");
  }

  const leadWhere: Record<string, unknown> = {};

  if (campaign.filterLeadStatus) {
    leadWhere.status = campaign.filterLeadStatus;
  }

  if (campaign.filterCity) {
    leadWhere.city = {
      contains: campaign.filterCity,
      mode: "insensitive",
    };
  }

  if (campaign.filterSource) {
    leadWhere.source = campaign.filterSource;
  }

  if (campaign.requireWhatsapp) {
    leadWhere.OR = [
      { whatsappNumber: { not: null } },
      { phone: { not: null } },
    ];
  }

  if (campaign.requireEmail) {
    leadWhere.email = { not: null };
  }

  const eligibleLeads = await prisma.workshopLead.findMany({
    where: leadWhere,
    orderBy: { createdAt: "asc" },
    take: campaign.dailyLimit,
  });

  if (eligibleLeads.length === 0) {
    revalidatePath("/admin/outreach/campaigns");
    return;
  }

  let createdCount = 0;

  for (const lead of eligibleLeads) {
    const existing = await prisma.outreachMessage.findFirst({
      where: {
        campaignId: campaign.id,
        workshopLeadId: lead.id,
        channel: campaign.channel,
      },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    const recipientPhone =
      campaign.channel === "whatsapp" || campaign.channel === "sms"
        ? lead.whatsappNumber || lead.phone
        : lead.phone;

    const recipientEmail = lead.email || null;

    if ((campaign.channel === "whatsapp" || campaign.channel === "sms") && !recipientPhone) {
      continue;
    }

    if (campaign.channel === "email" && !recipientEmail) {
      continue;
    }

    const bodySnapshot = applyTemplateVars(campaign.template.body, {
      shopName: lead.shopName,
      contactName: lead.contactName,
      city: lead.city,
      phone: lead.phone,
      email: lead.email,
    });

    await prisma.outreachMessage.create({
      data: {
        campaignId: campaign.id,
        workshopLeadId: lead.id,
        channel: campaign.channel,
        recipientName: lead.contactName || lead.shopName,
        recipientPhone,
        recipientEmail,
        bodySnapshot,
        mediaUrl: null,
        sendStatus: "pending",
      },
    });

    createdCount += 1;
  }

  await prisma.outreachCampaign.update({
    where: { id: campaign.id },
    data: {
      totalRecipients: {
        increment: createdCount,
      },
    },
  });

  revalidatePath("/admin/outreach/campaigns");
  revalidatePath("/admin/outreach/history");
}