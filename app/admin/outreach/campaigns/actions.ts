"use server";

import { sendEmailMessage } from "@/lib/outreach/send-email";
import { sendSmsMessage } from "@/lib/outreach/send-sms";
import { sendWhatsAppMessage } from "@/lib/outreach/send-whatsapp";
import type { OutreachSendResult } from "@/lib/outreach/types";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const CONTACT_COOLDOWN_DAYS = 14;

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

function getCooldownDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function hasRecentContact(params: {
  workshopLeadId: string;
  channel: string;
  excludeCampaignId?: string;
}) {
  const cooldownSince = getCooldownDate(CONTACT_COOLDOWN_DAYS);

  const recent = await prisma.outreachMessage.findFirst({
    where: {
      workshopLeadId: params.workshopLeadId,
      channel: params.channel,
      sendStatus: {
        in: ["sent", "replied"],
      },
      OR: [
        { sentAt: { gte: cooldownSince } },
        { repliedAt: { gte: cooldownSince } },
        { createdAt: { gte: cooldownSince } },
      ],
      ...(params.excludeCampaignId
        ? {
            campaignId: {
              not: params.excludeCampaignId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      sendStatus: true,
      createdAt: true,
      sentAt: true,
      repliedAt: true,
      campaignId: true,
    },
  });

  return recent;
}

async function sendOutreachMessage(params: {
  channel: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  subject?: string | null;
  bodySnapshot: string;
  mediaUrl?: string | null;
}): Promise<OutreachSendResult> {
  const payload = {
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    recipientEmail: params.recipientEmail,
    subject: params.subject,
    body: params.bodySnapshot,
    mediaUrl: params.mediaUrl,
  };

  if (params.channel === "email") {
    return sendEmailMessage(payload);
  }

  if (params.channel === "sms") {
    return sendSmsMessage(payload);
  }

  if (params.channel === "whatsapp") {
    return sendWhatsAppMessage(payload);
  }

  return {
    success: false,
    error: `Unsupported channel: ${params.channel}`,
  };
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
    leadWhere.OR = [{ whatsappNumber: { not: null } }, { phone: { not: null } }];
  }

  if (campaign.requireEmail) {
    leadWhere.email = { not: null };
  }

  const eligibleLeads = await prisma.workshopLead.findMany({
    where: leadWhere,
    orderBy: { createdAt: "asc" },
    take: Math.max(campaign.dailyLimit * 3, campaign.dailyLimit),
  });

  if (eligibleLeads.length === 0) {
    revalidatePath("/admin/outreach/campaigns");
    return;
  }

  let createdCount = 0;

  for (const lead of eligibleLeads) {
    if (createdCount >= campaign.dailyLimit) {
      break;
    }

    if (lead.status === "converted") {
      continue;
    }

    const existingInCampaign = await prisma.outreachMessage.findFirst({
      where: {
        campaignId: campaign.id,
        workshopLeadId: lead.id,
        channel: campaign.channel,
      },
      select: { id: true, sendStatus: true },
    });

    if (existingInCampaign) {
      continue;
    }

    const recentContact = await hasRecentContact({
      workshopLeadId: lead.id,
      channel: campaign.channel,
      excludeCampaignId: campaign.id,
    });

    if (recentContact) {
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
        errorMessage: null,
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

export async function sendPendingBatch(campaignId: string) {
  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
      messages: {
        where: {
          sendStatus: "pending",
        },
        include: {
          workshopLead: true,
        },
        orderBy: { createdAt: "asc" },
        take: 500,
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.status !== "active") {
    throw new Error("Only active campaigns can send pending batches.");
  }

  const batch = campaign.messages.slice(0, campaign.dailyLimit);

  if (batch.length === 0) {
    revalidatePath("/admin/outreach/campaigns");
    revalidatePath("/admin/outreach/history");
    return;
  }

  for (const message of batch) {
    if (message.workshopLead && message.workshopLead.status === "converted") {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: {
          sendStatus: "failed",
          errorMessage: "Lead is already converted.",
        },
      });

      await prisma.outreachCampaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: {
            increment: 1,
          },
        },
      });

      continue;
    }

    if (!message.workshopLeadId) {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: {
          sendStatus: "failed",
          errorMessage: "Missing workshop lead reference.",
        },
      });

      await prisma.outreachCampaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: {
            increment: 1,
          },
        },
      });

      continue;
    }

    const recentContact = await hasRecentContact({
      workshopLeadId: message.workshopLeadId,
      channel: message.channel,
      excludeCampaignId: campaign.id,
    });

    if (recentContact) {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: {
          sendStatus: "failed",
          errorMessage: `Blocked by ${CONTACT_COOLDOWN_DAYS}-day cooldown.`,
        },
      });

      await prisma.outreachCampaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: {
            increment: 1,
          },
        },
      });

      continue;
    }

    const result = await sendOutreachMessage({
      channel: message.channel,
      recipientName: message.recipientName,
      recipientPhone: message.recipientPhone,
      recipientEmail: message.recipientEmail,
      subject: campaign.template?.subject || null,
      bodySnapshot: message.bodySnapshot || "",
      mediaUrl: message.mediaUrl,
    });

    if (result.success) {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: {
          sendStatus: "sent",
          sentAt: new Date(),
          providerMessageId: result.providerMessageId || null,
          errorMessage: null,
        },
      });

      await prisma.outreachCampaign.update({
        where: { id: campaign.id },
        data: {
          sentCount: {
            increment: 1,
          },
        },
      });
    } else {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: {
          sendStatus: "failed",
          errorMessage: result.error || "Failed to send message.",
        },
      });

      await prisma.outreachCampaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: {
            increment: 1,
          },
        },
      });
    }
  }

  revalidatePath("/admin/outreach/campaigns");
  revalidatePath("/admin/outreach/history");
}