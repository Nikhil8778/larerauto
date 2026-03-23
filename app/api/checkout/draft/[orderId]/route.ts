import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMechanic } from "@/lib/mechanic-auth";

type Params = Promise<{
  orderId: string;
}>;

export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  try {
    const mechanic = await getCurrentMechanic();

    if (!mechanic || !mechanic.isApproved || !mechanic.isActive) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Draft order not found." },
        { status: 404 }
      );
    }

    if (order.mechanicId !== mechanic.id || order.orderPlacedByType !== "mechanic") {
      return NextResponse.json(
        {
          success: false,
          message: "This order does not belong to the current mechanic.",
        },
        { status: 403 }
      );
    }

    if (order.status !== "draft" || order.paymentStatus !== "pending") {
      return NextResponse.json(
        { success: false, message: "This order is not resumable." },
        { status: 400 }
      );
    }

    const item = order.items[0];
    const customerName =
      [order.customer?.firstName, order.customer?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || mechanic.contactName || "";

    return NextResponse.json({
      success: true,
      draft: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        offerId: item?.offerId || "",
        partType: item?.partTypeName || "Item",
        quantity: item?.quantity || 1,
        itemPriceCents: item?.unitPriceCents || 0,
        subtotalCents: order.subtotalCents,
        deliveryCents: order.deliveryChargeCents || order.shippingCents || 0,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        fullName: customerName,
        email: order.billingEmail || order.customer?.email || mechanic.email || "",
        phone: order.customer?.phone || mechanic.phone || "",
        addressLine1: order.addressLine1 || "",
        addressLine2: order.addressLine2 || "",
        city: order.city || "",
        province: order.province || "",
        postalCode: order.postalCode || "",
        country: order.country || "Canada",
        estimatedDeliveryText: order.estimatedDeliveryText || "",
        mechanicDiscountCents: order.mechanicDiscountCents || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/checkout/draft/[orderId] error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load draft checkout." },
      { status: 500 }
    );
  }
}