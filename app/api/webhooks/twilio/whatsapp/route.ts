import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function first(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeTwilioStatus(raw: string) {
  const status = raw.trim().toLowerCase();

  if (status === "delivered") return "delivered";
  if (status === "sent") return "sent";
  if (status === "failed" || status === "undelivered") return "failed";

  return "";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const messageSid = first(form.get("MessageSid")?.toString());
    const messageStatus = first(form.get("MessageStatus")?.toString());
    const errorCode = first(form.get("ErrorCode")?.toString());
    const errorMessage = first(form.get("ErrorMessage")?.toString());

    if (!messageSid) {
      return NextResponse.json(
        { success: false, message: "Missing MessageSid." },
        { status: 400 }
      );
    }

    const message = await prisma.outreachMessage.findFirst({
      where: {
        providerMessageId: messageSid,
      },
      select: {
        id: true,
        sendStatus: true,
      },
    });

    if (!message) {
      return NextResponse.json({
        success: true,
        message: "No matching outreach message found.",
      });
    }

    const mappedStatus = normalizeTwilioStatus(messageStatus);

    const data: {
      sendStatus?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      errorMessage?: string | null;
    } = {};

    if (mappedStatus === "sent") {
      data.sendStatus = "sent";
      if (!message.sendStatus || message.sendStatus === "pending") {
        data.sentAt = new Date();
      }
      data.errorMessage = null;
    }

    if (mappedStatus === "delivered") {
      data.sendStatus = "delivered";
      data.deliveredAt = new Date();
      data.errorMessage = null;
    }

    if (mappedStatus === "failed") {
      data.sendStatus = "failed";
      data.errorMessage =
        [errorCode ? `Code ${errorCode}` : "", errorMessage]
          .filter(Boolean)
          .join(" - ") || "Twilio reported delivery failure.";
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({
        success: true,
        message: "Webhook received but no mapped status change applied.",
      });
    }

    await prisma.outreachMessage.update({
      where: { id: message.id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (error) {
    console.error("Twilio WhatsApp webhook error:", error);

    return NextResponse.json(
      { success: false, message: "Webhook processing failed." },
      { status: 500 }
    );
  }
}