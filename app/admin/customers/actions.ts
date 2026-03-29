"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendWhatsAppMessage } from "@/lib/outreach/send-whatsapp";
import { sendSmsMessage } from "@/lib/outreach/send-sms";
import { sendEmailMessage } from "@/lib/outreach/send-email";

function makeInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

function buildInviteMessage(params: {
  firstName?: string | null;
  companyName?: string | null;
  signupUrl: string;
  expiresAt: Date;
}) {
  const name =
    params.firstName?.trim() ||
    params.companyName?.trim() ||
    "there";

  return `Hi ${name},

You are eligible to join the Lare Auto mechanic / workshop partner program.

Benefits may include:
- trade pricing on direct purchases
- referral earnings when your customer buys from Lare Auto
- partner access for future growth

Create your account here:
${params.signupUrl}

This signup link expires on ${params.expiresAt.toLocaleString()}.

Regards,
Lare Auto
www.lareauto.ca`;
}

export async function sendMechanicInvite(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      convertedWorkshopLead: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const inviteToken = makeInviteToken();
  const inviteExpiresAt = new Date();
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

  const signupUrl = `${baseUrl}/mechanic-signup?token=${inviteToken}`;

  const inviteBody = buildInviteMessage({
    firstName: customer.firstName,
    companyName: customer.companyName,
    signupUrl,
    expiresAt: inviteExpiresAt,
  });

  const emailSubject = "Join the Lare Auto Mechanic / Workshop Program";

  let sendResult:
    | { success: true; providerMessageId?: string | null }
    | { success: false; error?: string | null };

  let sentChannel = "";

  if (customer.whatsappNumber || customer.phone) {
    sentChannel = "whatsapp";
    sendResult = await sendWhatsAppMessage({
      recipientName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      recipientPhone: customer.whatsappNumber || customer.phone || undefined,
      recipientEmail: customer.email || undefined,
      body: inviteBody,
      subject: emailSubject,
    });

    if (!sendResult.success && customer.phone) {
      sentChannel = "sms";
      sendResult = await sendSmsMessage({
        recipientName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
        recipientPhone: customer.phone,
        recipientEmail: customer.email || undefined,
        body: inviteBody,
        subject: emailSubject,
      });
    }
  } else if (customer.email) {
    sentChannel = "email";
    sendResult = await sendEmailMessage({
      recipientName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      recipientEmail: customer.email,
      recipientPhone: customer.phone || customer.whatsappNumber || undefined,
      subject: emailSubject,
      body: inviteBody,
    });
  } else {
    throw new Error("Customer has no WhatsApp, phone, or email for invite delivery.");
  }

  if (!sendResult.success) {
    throw new Error(sendResult.error || "Failed to send mechanic invite.");
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      isMechanicEligible: true,
      mechanicEligibleAt: customer.mechanicEligibleAt ?? new Date(),
      mechanicInviteSentAt: new Date(),
      mechanicInviteToken: inviteToken,
      mechanicInviteExpiresAt: inviteExpiresAt,
    },
  });

  if (customer.convertedWorkshopLead) {
    await prisma.outreachLeadFollowUp.create({
      data: {
        workshopLeadId: customer.convertedWorkshopLead.id,
        note: `Mechanic program invite sent via ${sentChannel} to customer ${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ""}. Signup link expires on ${inviteExpiresAt.toLocaleString()}. Provider message id: ${sendResult.providerMessageId || "n/a"}.`,
        followUpAt: null,
        status: "open",
      },
    });
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/outreach/leads");
  if (customer.convertedWorkshopLead) {
    revalidatePath(`/admin/outreach/leads/${customer.convertedWorkshopLead.id}`);
  }

  return {
    ok: true,
    signupUrl,
    inviteToken,
    expiresAt: inviteExpiresAt.toISOString(),
    sentChannel,
    providerMessageId: sendResult.providerMessageId || null,
  };
}