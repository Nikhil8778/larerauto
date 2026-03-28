import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsMessage } from "@/lib/outreach/send-sms";
import { sendWhatsAppMessage } from "@/lib/outreach/send-whatsapp";
import {
  buildMissingQuestion,
  detectEngine,
  detectMake,
  detectModel,
  detectPartType,
  extractYear,
  findBestOffer,
} from "@/lib/outreach/inbound-quote";

function cleanFrom(value: string) {
  return value.replace(/^whatsapp:/i, "").trim();
}

function detectChannel(from: string) {
  return from.startsWith("whatsapp:") ? "whatsapp" : "sms";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const fromRaw = String(form.get("From") ?? "");
    const body = String(form.get("Body") ?? "").trim();
    const providerMessageId = String(form.get("MessageSid") ?? "");

    if (!fromRaw || !body) {
      return new NextResponse("Missing From or Body.", { status: 400 });
    }

    const channel = detectChannel(fromRaw);
    const fromNumber = cleanFrom(fromRaw);

    const latestOutbound = await prisma.outreachMessage.findFirst({
      where: {
        channel,
        recipientPhone: {
          contains: fromNumber.slice(-10),
        },
        sendStatus: {
          in: ["sent", "delivered", "replied"],
        },
      },
      include: {
        workshopLead: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOutbound) {
      return new NextResponse("No matching outbound message found.", { status: 200 });
    }

    await prisma.outreachInboundMessage.create({
      data: {
        outreachMessageId: latestOutbound.id,
        workshopLeadId: latestOutbound.workshopLeadId || null,
        channel,
        fromNumber,
        body,
        providerMessageId: providerMessageId || null,
      },
    });

    await prisma.outreachMessage.update({
      where: { id: latestOutbound.id },
      data: {
        sendStatus: "replied",
        repliedAt: new Date(),
        errorMessage: null,
      },
    });

    if (
      latestOutbound.workshopLeadId &&
      latestOutbound.workshopLead?.status !== "converted"
    ) {
      await prisma.workshopLead.update({
        where: { id: latestOutbound.workshopLeadId },
        data: {
          status: "replied",
        },
      });
    }

    if (!latestOutbound.workshopLeadId) {
      return new NextResponse("Reply saved without linked lead.", { status: 200 });
    }

    let session = await prisma.outreachReplySession.findUnique({
      where: {
        workshopLeadId: latestOutbound.workshopLeadId,
      },
    });

    if (!session) {
      session = await prisma.outreachReplySession.create({
        data: {
          workshopLeadId: latestOutbound.workshopLeadId,
          channel,
          lastOutboundId: latestOutbound.id,
          lastInboundAt: new Date(),
        },
      });
    }

    const detectedPartType = detectPartType(body) || session.partType || null;
    const detectedYear = extractYear(body) || session.year || null;

    const detectedMakeValue = (await detectMake(body)) || session.make || null;

    const detectedModelValue =
      detectedMakeValue &&
      ((await detectModel(detectedMakeValue, body)) || session.model || null);

    const detectedEngineValue =
      detectedMakeValue &&
      detectedModelValue &&
      ((await detectEngine(detectedMakeValue, detectedModelValue, body)) ||
        session.engine ||
        null);

    session = await prisma.outreachReplySession.update({
      where: { id: session.id },
      data: {
        partType: detectedPartType,
        year: detectedYear,
        make: detectedMakeValue,
        model: detectedModelValue || null,
        engine: detectedEngineValue || null,
        lastInboundAt: new Date(),
      },
    });

    const missingQuestion = buildMissingQuestion({
      partType: session.partType,
      year: session.year,
      make: session.make,
      model: session.model,
      engine: session.engine,
    });

    if (missingQuestion) {
      const sendResult =
        channel === "whatsapp"
          ? await sendWhatsAppMessage({
              recipientPhone: latestOutbound.recipientPhone,
              body: missingQuestion,
            })
          : await sendSmsMessage({
              recipientPhone: latestOutbound.recipientPhone,
              body: missingQuestion,
            });

      const createdFollowup = await prisma.outreachMessage.create({
        data: {
          campaignId: latestOutbound.campaignId,
          workshopLeadId: latestOutbound.workshopLeadId,
          channel,
          recipientName: latestOutbound.recipientName,
          recipientPhone: latestOutbound.recipientPhone,
          recipientEmail: latestOutbound.recipientEmail,
          bodySnapshot: missingQuestion,
          mediaUrl: null,
          sendStatus: sendResult.success ? "sent" : "failed",
          providerMessageId: sendResult.success
            ? sendResult.providerMessageId || null
            : null,
          errorMessage: sendResult.success
            ? null
            : sendResult.error || "Failed to send follow-up question.",
          sentAt: sendResult.success ? new Date() : null,
        },
      });

      await prisma.outreachReplySession.update({
        where: { id: session.id },
        data: {
          lastOutboundAt: new Date(),
          lastOutboundId: createdFollowup.id,
        },
      });

      return new NextResponse("Missing details question sent.", { status: 200 });
    }

    const offer = await findBestOffer({
      year: session.year!,
      make: session.make!,
      model: session.model!,
      engine: session.engine!,
      partType: session.partType!,
    });

    let replyText = "";

    if (offer) {
      const price = (offer.sellPriceCents / 100).toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
      });

      replyText = `${session.partType} for ${session.year} ${session.make} ${session.model} ${session.engine} is available at ${price}. Taxes and delivery extra. Let us know if you also need related parts.`;
    } else {
      replyText = `We could not find an exact offer yet for ${session.year} ${session.make} ${session.model} ${session.engine} ${session.partType}. Please send VIN if available, and we will check further.`;
    }

    const sendResult =
      channel === "whatsapp"
        ? await sendWhatsAppMessage({
            recipientPhone: latestOutbound.recipientPhone,
            body: replyText,
          })
        : await sendSmsMessage({
            recipientPhone: latestOutbound.recipientPhone,
            body: replyText,
          });

    const createdQuoteReply = await prisma.outreachMessage.create({
      data: {
        campaignId: latestOutbound.campaignId,
        workshopLeadId: latestOutbound.workshopLeadId,
        channel,
        recipientName: latestOutbound.recipientName,
        recipientPhone: latestOutbound.recipientPhone,
        recipientEmail: latestOutbound.recipientEmail,
        bodySnapshot: replyText,
        mediaUrl: null,
        sendStatus: sendResult.success ? "sent" : "failed",
        providerMessageId: sendResult.success
          ? sendResult.providerMessageId || null
          : null,
        errorMessage: sendResult.success
          ? null
          : sendResult.error || "Failed to send quote reply.",
        sentAt: sendResult.success ? new Date() : null,
      },
    });

    await prisma.outreachReplySession.update({
      where: { id: session.id },
      data: {
        status: offer ? "quoted" : "open",
        lastOutboundAt: new Date(),
        lastOutboundId: createdQuoteReply.id,
      },
    });

    return new NextResponse("Auto quote reply processed.", { status: 200 });
  } catch (error) {
    console.error("Inbound Twilio webhook error:", error);
    return new NextResponse("Inbound processing failed.", { status: 500 });
  }
}