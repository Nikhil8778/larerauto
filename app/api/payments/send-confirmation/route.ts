import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAccountsEmail } from "@/lib/email";

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

    const customerEmail =
      order.billingEmail ||
      order.customer?.email ||
      String(body.customerEmail ?? body.email ?? "").trim() ||
      "";

    const customerName =
      String(body.customerName ?? body.name ?? "Customer").trim() || "Customer";

    const amount = Number(order.totalCents) / 100;
    const safeOrderId = String(order.orderNumber || order.id);

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email not found." },
        { status: 400 }
      );
    }

    console.log("send-confirmation payload:", {
      orderId,
      invoiceId,
      paymentReference,
      customerEmail,
      customerName,
      amount,
      safeOrderId,
    });

    const accountsResult = await sendAccountsEmail({
      customerName,
      customerEmail,
      amount,
      orderId: safeOrderId,
    });

    return NextResponse.json({
      ok: true,
      accountsResult,
      message: "Accounts notification email sent successfully.",
    });
  } catch (error: any) {
    console.error("send confirmation email error:", error);
    console.error(
      "send confirmation email detail:",
      error?.message || error
    );

    return NextResponse.json(
      {
        error: "Unable to send accounts confirmation email.",
        detail: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}