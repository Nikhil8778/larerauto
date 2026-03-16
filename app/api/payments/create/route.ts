import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { squareClient, SQUARE_LOCATION_ID } from "@/lib/square";

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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!order || !invoice) {
      return NextResponse.json(
        { error: "Order or invoice not found." },
        { status: 404 }
      );
    }

    if (!SQUARE_LOCATION_ID) {
      return NextResponse.json(
        { error: "Square location is not configured." },
        { status: 500 }
      );
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
      note: `Order ${order.orderNumber}`,
      autocomplete: true,
      buyerEmailAddress: order.billingEmail || order.customer.email || undefined,
      referenceId: order.orderNumber,
    });

    const payment = squareResponse.result.payment;

    if (!payment?.id) {
      return NextResponse.json(
        { error: "Square payment did not return a payment id." },
        { status: 500 }
      );
    }

    const paidAt = new Date();

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: "processing",
        paidAt,
        paymentReference: payment.id,
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        paidAt,
        paymentReference: payment.id,
        transactionId: payment.id,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      paymentReference: payment.id,
    });
  } catch (error: any) {
    console.error("square payment create error", error);
    return NextResponse.json(
      { error: "Unable to process payment." },
      { status: 500 }
    );
  }
}