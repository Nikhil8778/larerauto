"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/outreach/send-whatsapp";
import { sendSmsMessage } from "@/lib/outreach/send-sms";
import { sendEmailMessage } from "@/lib/outreach/send-email";

function buildMechanicApprovalMessage(params: {
  contactName?: string | null;
  shopName?: string | null;
  loginUrl: string;
}) {
  const name =
    params.contactName?.trim() ||
    params.shopName?.trim() ||
    "there";

  const body = `Hi ${name},

Your Lare Auto mechanic / workshop partner account has been approved.

You can now log in here:
${params.loginUrl}

After login, you can:
- buy parts using your trade pricing
- generate referral codes for your customers
- track direct purchases
- track referral purchases and credits

Regards,
Lare Auto
www.lareauto.ca`;

  const subject = "Your Lare Auto Mechanic Account Has Been Approved";

  return { subject, body };
}

export async function approveMechanic(mechanicId: string) {
  const mechanic = await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      isApproved: true,
      isActive: true,
    },
    select: {
      id: true,
      shopName: true,
      contactName: true,
      email: true,
      phone: true,
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://www.lareauto.ca";

  const loginUrl = `${baseUrl}/mechanic-login`;

  const content = buildMechanicApprovalMessage({
    contactName: mechanic.contactName,
    shopName: mechanic.shopName,
    loginUrl,
  });

  const recipientName =
    mechanic.contactName?.trim() ||
    mechanic.shopName ||
    "Mechanic Partner";

  let sent = false;

  if (mechanic.phone) {
    const whatsappResult = await sendWhatsAppMessage({
      recipientName,
      recipientPhone: mechanic.phone,
      recipientEmail: mechanic.email || undefined,
      body: content.body,
      subject: content.subject,
    });

    if (whatsappResult.success) {
      sent = true;
    } else {
      const smsResult = await sendSmsMessage({
        recipientName,
        recipientPhone: mechanic.phone,
        recipientEmail: mechanic.email || undefined,
        body: content.body,
        subject: content.subject,
      });

      if (smsResult.success) {
        sent = true;
      }
    }
  }

  if (!sent && mechanic.email) {
    await sendEmailMessage({
      recipientName,
      recipientEmail: mechanic.email,
      recipientPhone: mechanic.phone || undefined,
      subject: content.subject,
      body: content.body,
    });
  }

  revalidatePath("/admin/mechanics");
}

export async function deactivateMechanic(mechanicId: string) {
  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/admin/mechanics");
}

export async function activateMechanic(mechanicId: string) {
  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      isActive: true,
    },
  });

  revalidatePath("/admin/mechanics");
}

export async function markMechanicCommissionsPaid(
  mechanicId: string,
  payoutNote?: string
) {
  const pendingCommissions = await prisma.mechanicCommission.findMany({
    where: {
      mechanicId,
      status: "pending",
    },
    select: {
      id: true,
      amountCents: true,
    },
  });

  if (pendingCommissions.length === 0) {
    revalidatePath("/admin/mechanics");
    return;
  }

  const totalPaidCents = pendingCommissions.reduce(
    (sum, item) => sum + item.amountCents,
    0
  );

  const paidAt = new Date();

  await prisma.mechanicCommission.updateMany({
    where: {
      mechanicId,
      status: "pending",
    },
    data: {
      status: "paid",
      paidAt,
      payoutNote: payoutNote?.trim() || "Weekly Interac payout",
    },
  });

  await prisma.mechanic.update({
    where: { id: mechanicId },
    data: {
      creditBalanceCents: {
        decrement: totalPaidCents,
      },
    },
  });

  revalidatePath("/admin/mechanics");
}