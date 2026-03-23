import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { squareClient, SQUARE_LOCATION_ID } from "@/lib/square";
import { resend, EMAILS } from "@/lib/email";
import {
  buildInvoiceEmailHtml,
  buildInvoiceEmailText,
} from "@/lib/invoice-email";
import { generateInvoicePdf } from "@/lib/invoice-pdf";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = String(body.orderId ?? "").trim();
    const invoiceId = String(body.invoiceId ?? "").trim();
    const sourceId = String(body.sourceId ?? "").trim();

    if (!orderId || !invoiceId || !sourceId) {
      return NextResponse.json(
        { error: "orderId, invoiceId and sourceId are required." },
        { status: 400 }
      );
    }

    if (!SQUARE_LOCATION_ID) {
      return NextResponse.json(
        { error: "Square location is not configured." },
        { status: 500 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderToken: order.customerAccessToken,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceToken: invoice.customerAccessToken,
        paymentReference: order.paymentReference,
        alreadyPaid: true,
      });
    }

    const paymentsApi = squareClient.paymentsApi;

    const squareResponse = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      locationId: SQUARE_LOCATION_ID,
      amountMoney: {
        amount: BigInt(order.totalCents),
        currency: "CAD",
      },
      autocomplete: true,
      note: `Lare Auto order ${order.orderNumber}`,
      referenceId: order.orderNumber,
      buyerEmailAddress: order.billingEmail || order.customer?.email || undefined,
    });

    const payment = squareResponse.result.payment;

    if (!payment?.id) {
      return NextResponse.json(
        { error: "Square payment did not return a payment id." },
        { status: 500 }
      );
    }

    const paidAt = new Date();

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt,
        paymentReference: payment.id,
      },
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        paidAt,
        paymentReference: payment.id,
        transactionId: payment.id,
      },
    });

    console.log("payment referral update check:", {
      referralCodeId: updatedOrder.referralCodeId,
      referredByMechanicId: updatedOrder.referredByMechanicId,
      mechanicCreditCents: updatedOrder.mechanicCreditCents,
    });

    if (updatedOrder.referredByMechanicId && updatedOrder.mechanicCreditCents > 0) {
      await prisma.mechanic.update({
        where: { id: updatedOrder.referredByMechanicId },
        data: {
          creditBalanceCents: {
            increment: updatedOrder.mechanicCreditCents,
          },
        },
      });
    }

    if (updatedOrder.referralCodeId) {
      const referralCode = await prisma.mechanicReferralCode.findUnique({
        where: { id: updatedOrder.referralCodeId },
        select: {
          id: true,
          usedCount: true,
          usageLimit: true,
          isActive: true,
        },
      });

      if (referralCode) {
        const nextUsedCount = referralCode.usedCount + 1;

        await prisma.mechanicReferralCode.update({
          where: { id: referralCode.id },
          data: {
            usedCount: {
              increment: 1,
            },
            isActive:
              typeof referralCode.usageLimit === "number"
                ? nextUsedCount < referralCode.usageLimit
                : referralCode.isActive,
          },
        });
      }
    }

    const customerEmail = order.billingEmail || order.customer?.email || "";
    const customerName =
      [order.customer?.firstName, order.customer?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "Customer";

    if (resend && customerEmail) {
      try {
        const firstItem = order.items[0];

        const pdfBuffer = await generateInvoicePdf({
          businessName: "Lare Auto",
          businessEmail: process.env.BUSINESS_EMAIL || null,
          businessPhone: process.env.BUSINESS_PHONE || null,
          invoiceNumber: updatedInvoice.invoiceNumber,
          orderNumber: updatedOrder.orderNumber,
          customerName,
          customerEmail,
          addressLines: [
            updatedOrder.addressLine1 || "",
            updatedOrder.addressLine2 || "",
            [updatedOrder.city, updatedOrder.province, updatedOrder.postalCode]
              .filter(Boolean)
              .join(", "),
            updatedOrder.country || "",
          ],
          itemTitle: firstItem?.title || "Auto Part",
          itemDescription: firstItem?.description || "",
          quantity: firstItem?.quantity || 1,
          unitPriceCents: firstItem?.unitPriceCents || 0,
          subtotalCents: updatedOrder.subtotalCents,
          shippingCents: updatedOrder.shippingCents,
          taxCents: updatedOrder.taxCents,
          totalCents: updatedOrder.totalCents,
          currency: updatedOrder.currency || "CAD",
          paidAt,
        });

        await resend.emails.send({
          from: `Lare Auto <${EMAILS.noReply}>`,
          to: customerEmail,
          subject: `Invoice ${updatedInvoice.invoiceNumber} for Order ${updatedOrder.orderNumber}`,
          html: buildInvoiceEmailHtml({
            customerName,
            customerEmail,
            orderNumber: updatedOrder.orderNumber,
            invoiceNumber: updatedInvoice.invoiceNumber,
            totalCents: updatedOrder.totalCents,
            currency: updatedOrder.currency || "CAD",
          }),
          text: buildInvoiceEmailText({
            customerName,
            customerEmail,
            orderNumber: updatedOrder.orderNumber,
            invoiceNumber: updatedInvoice.invoiceNumber,
            totalCents: updatedOrder.totalCents,
            currency: updatedOrder.currency || "CAD",
          }),
          attachments: [
            {
              filename: `${updatedInvoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        await prisma.invoice.update({
          where: { id: updatedInvoice.id },
          data: {
            emailSentAt: new Date(),
          },
        });
      } catch (emailError: any) {
        console.error("invoice email send error:", emailError);
        console.error(
          "invoice email send error detail:",
          emailError?.message || emailError
        );
      }
    }

    return NextResponse.json({
      ok: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      orderToken: updatedOrder.customerAccessToken,
      invoiceId: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      invoiceToken: updatedInvoice.customerAccessToken,
      paymentReference: payment.id,
    });
  } catch (error: any) {
    console.error("square payment route error:", error);

    const squareErrors = error?.result?.errors ?? error?.errors ?? null;

    if (squareErrors) {
      return NextResponse.json(
        {
          error: "Square payment failed.",
          details: squareErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process payment." },
      { status: 500 }
    );
  }
}