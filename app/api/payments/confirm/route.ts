import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const orderId = String(body.orderId ?? "").trim();
    const invoiceId = String(body.invoiceId ?? "").trim();
    const paymentReference = String(body.paymentReference ?? "").trim();

    if (!orderId || !invoiceId || !paymentReference) {
      return NextResponse.json(
        { error: "orderId, invoiceId and paymentReference are required." },
        { status: 400 }
      );
    }

    const paidAt = new Date();

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "paid",
        status: "processing",
        paidAt,
        paymentReference,
      },
    });

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "paid",
        paidAt,
        paymentReference,
        transactionId: paymentReference,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error("payment confirm error", error);
    return NextResponse.json(
      { error: "Unable to confirm payment." },
      { status: 500 }
    );
  }
}