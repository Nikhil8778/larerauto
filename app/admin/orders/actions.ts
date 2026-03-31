"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmailMessage } from "@/lib/outreach/send-email";
import { sendSmsMessage } from "@/lib/outreach/send-sms";
import { sendWhatsAppMessage } from "@/lib/outreach/send-whatsapp";

type NotificationContent = {
  subject: string;
  body: string;
};

function buildCustomerMessage(
  orderNumber: string,
  type:
    | "inventory_pending"
    | "inventory_confirmed"
    | "inventory_unavailable"
    | "alternate_offered"
    | "packed"
    | "dispatched"
    | "in_transit"
    | "delivered"
): NotificationContent {
  if (type === "inventory_confirmed") {
    return {
      subject: `Stock Update for Order ${orderNumber}`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `Pricing is confirmed, and inventory availability has now been verified for your order ${orderNumber}.\n\n` +
        `Your order is ready for the next processing step. Our team will keep you updated.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  if (type === "inventory_unavailable") {
    return {
      subject: `Stock Update for Order ${orderNumber}`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `We have completed our inventory verification for order ${orderNumber}. At this time, the requested item is currently unavailable.\n\n` +
        `Our team can help check an alternate option for you and will update you shortly.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  if (type === "alternate_offered") {
    return {
      subject: `Alternate Option Update for Order ${orderNumber}`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `We have completed our inventory review for order ${orderNumber} and an alternate option is being prepared for you.\n\n` +
        `Our team will share the next update shortly.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  if (type === "packed") {
    return {
      subject: `Order ${orderNumber} is Being Prepared`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `Your order ${orderNumber} has been packed and is being prepared for dispatch.\n\n` +
        `We will share the next delivery update shortly.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  if (type === "dispatched") {
    return {
      subject: `Order ${orderNumber} has been Dispatched`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `Your order ${orderNumber} has been dispatched from our side.\n\n` +
        `We will continue to keep you updated on the delivery progress.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  if (type === "in_transit") {
    return {
      subject: `Order ${orderNumber} is In Transit`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `Your order ${orderNumber} is currently in transit.\n\n` +
        `We will notify you once it is delivered.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  if (type === "delivered") {
    return {
      subject: `Order ${orderNumber} Delivered`,
      body:
        `Thank you for choosing Lare Auto.\n\n` +
        `Your order ${orderNumber} has been marked as delivered.\n\n` +
        `We appreciate your business and look forward to serving you again.\n\n` +
        `Regards,\nLARE Auto`,
    };
  }

  return {
    subject: `Inventory Update for Order ${orderNumber}`,
    body:
      `Thank you for choosing Lare Auto.\n\n` +
      `Pricing is confirmed. Inventory availability is currently being verified, and we will update you shortly for order ${orderNumber}.\n\n` +
      `Regards,\nLARE Auto`,
  };
}

async function notifyCustomer(
  orderId: string,
  type:
    | "inventory_pending"
    | "inventory_confirmed"
    | "inventory_unavailable"
    | "alternate_offered"
    | "packed"
    | "dispatched"
    | "in_transit"
    | "delivered"
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (!order || !order.customer) return;

  const recipientName =
    [order.customer.firstName, order.customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || order.customer.firstName || "Customer";

  const content = buildCustomerMessage(order.orderNumber, type);

  const preferred =
    order.preferredReplyChannel ||
    order.customer.preferredReplyChannel ||
    "email";

  if (preferred === "dashboard") {
    return;
  }

  if (preferred === "whatsapp") {
    if (order.customer.whatsappNumber) {
      try {
        await sendWhatsAppMessage({
          recipientName,
          recipientPhone: order.customer.whatsappNumber,
          body: content.body,
        });
        return;
      } catch (error) {
        console.error("whatsapp notification error:", error);
      }
    }

    if (order.customer.phone) {
      try {
        await sendSmsMessage({
          recipientName,
          recipientPhone: order.customer.phone,
          body: content.body,
        });
        return;
      } catch (error) {
        console.error("sms fallback error:", error);
      }
    }

    if (order.customer.email) {
      try {
        await sendEmailMessage({
          recipientName,
          recipientEmail: order.customer.email,
          body: content.body,
          subject: content.subject,
        });
      } catch (error) {
        console.error("email fallback error:", error);
      }
    }

    return;
  }

  if (preferred === "platform") {
    if (order.customer.phone) {
      try {
        await sendSmsMessage({
          recipientName,
          recipientPhone: order.customer.phone,
          body: content.body,
        });
        return;
      } catch (error) {
        console.error("platform sms fallback error:", error);
      }
    }

    if (order.customer.email) {
      try {
        await sendEmailMessage({
          recipientName,
          recipientEmail: order.customer.email,
          body: content.body,
          subject: content.subject,
        });
      } catch (error) {
        console.error("platform email fallback error:", error);
      }
    }

    return;
  }

  if (order.customer.email) {
    try {
      await sendEmailMessage({
        recipientName,
        recipientEmail: order.customer.email,
        body: content.body,
        subject: content.subject,
      });
      return;
    } catch (error) {
      console.error("email notification error:", error);
    }
  }

  if (order.customer.phone) {
    try {
      await sendSmsMessage({
        recipientName,
        recipientPhone: order.customer.phone,
        body: content.body,
      });
      return;
    } catch (error) {
      console.error("sms notification error:", error);
    }
  }

  if (order.customer.whatsappNumber) {
    try {
      await sendWhatsAppMessage({
        recipientName,
        recipientPhone: order.customer.whatsappNumber,
        body: content.body,
      });
    } catch (error) {
      console.error("whatsapp fallback error:", error);
    }
  }
}

async function updateInventoryStatus(
  orderId: string,
  inventoryStatus: string,
  inventoryNotes?: string,
  supplierName?: string,
  supplierReference?: string
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      inventoryStatus,
      inventoryCheckedAt: new Date(),
      inventoryCheckedBy: "admin",
      inventoryNotes: inventoryNotes?.trim() || null,
      supplierName: supplierName?.trim() || "Logel's",
      supplierReference: supplierReference?.trim() || null,
      inventoryUpdatedAt: new Date(),
    },
  });

  await notifyCustomer(
    orderId,
    inventoryStatus === "inventory_confirmed"
      ? "inventory_confirmed"
      : inventoryStatus === "inventory_unavailable"
      ? "inventory_unavailable"
      : inventoryStatus === "alternate_offered"
      ? "alternate_offered"
      : "inventory_pending"
  );

  revalidatePath("/admin/orders");
  revalidatePath("/mechanic-dashboard");
}

async function updateDeliveryStatus(
  orderId: string,
  deliveryStatus: string,
  deliveryNotes?: string,
  courierName?: string,
  trackingReference?: string
) {
  const now = new Date();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryStatus,
      deliveryNotes: deliveryNotes?.trim() || null,
      courierName: courierName?.trim() || null,
      trackingReference: trackingReference?.trim() || null,
      deliveryUpdatedAt: now,
      fulfillmentStatus:
        deliveryStatus === "delivered"
          ? "fulfilled"
          : deliveryStatus === "pending"
          ? "unfulfilled"
          : "processing",
      ...(deliveryStatus === "dispatched" ? { dispatchedAt: now } : {}),
      ...(deliveryStatus === "delivered" ? { deliveredAt: now } : {}),
    },
  });

  await notifyCustomer(
    orderId,
    deliveryStatus === "packed"
      ? "packed"
      : deliveryStatus === "dispatched"
      ? "dispatched"
      : deliveryStatus === "in_transit"
      ? "in_transit"
      : "delivered"
  );

  revalidatePath("/admin/orders");
  revalidatePath("/mechanic-dashboard");
}

export async function markInventoryPending(
  orderId: string,
  inventoryNotes?: string,
  supplierReference?: string
) {
  await updateInventoryStatus(
    orderId,
    "inventory_check_pending",
    inventoryNotes,
    "Logel's",
    supplierReference
  );
}

export async function markInventoryConfirmed(
  orderId: string,
  inventoryNotes?: string,
  supplierReference?: string
) {
  await updateInventoryStatus(
    orderId,
    "inventory_confirmed",
    inventoryNotes,
    "Logel's",
    supplierReference
  );
}

export async function markInventoryUnavailable(
  orderId: string,
  inventoryNotes?: string,
  supplierReference?: string
) {
  await updateInventoryStatus(
    orderId,
    "inventory_unavailable",
    inventoryNotes,
    "Logel's",
    supplierReference
  );
}

export async function markAlternateOffered(
  orderId: string,
  inventoryNotes?: string,
  supplierReference?: string
) {
  await updateInventoryStatus(
    orderId,
    "alternate_offered",
    inventoryNotes,
    "Logel's",
    supplierReference
  );
}

export async function markOrderPacked(
  orderId: string,
  deliveryNotes?: string,
  courierName?: string,
  trackingReference?: string
) {
  await updateDeliveryStatus(
    orderId,
    "packed",
    deliveryNotes || "Your order has been packed and is being prepared for dispatch.",
    courierName,
    trackingReference
  );
}

export async function markOrderDispatched(
  orderId: string,
  deliveryNotes?: string,
  courierName?: string,
  trackingReference?: string
) {
  await updateDeliveryStatus(
    orderId,
    "dispatched",
    deliveryNotes || "Your order has been dispatched from our side.",
    courierName,
    trackingReference
  );
}

export async function markOrderInTransit(
  orderId: string,
  deliveryNotes?: string,
  courierName?: string,
  trackingReference?: string
) {
  await updateDeliveryStatus(
    orderId,
    "in_transit",
    deliveryNotes || "Your order is currently in transit.",
    courierName,
    trackingReference
  );
}

export async function markOrderDelivered(
  orderId: string,
  deliveryNotes?: string,
  courierName?: string,
  trackingReference?: string
) {
  await updateDeliveryStatus(
    orderId,
    "delivered",
    deliveryNotes || "Your order has been delivered.",
    courierName,
    trackingReference
  );
}