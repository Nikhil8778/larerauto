 "use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function toNullableString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toNonNegativeInt(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim() || "0");
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

export async function updateOrderOpsDetails(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    throw new Error("Order id is required.");
  }

  const vendorCostCents = toNonNegativeInt(formData.get("vendorCostCents"));
  const transportCostCents = toNonNegativeInt(formData.get("transportCostCents"));
  const packagingCostCents = toNonNegativeInt(formData.get("packagingCostCents"));

  const vendorInvoiceRef = toNullableString(formData.get("vendorInvoiceRef"));
  const payoutNotes = toNullableString(formData.get("payoutNotes"));

  const internalNotes = toNullableString(formData.get("internalNotes"));
  const customerNotes = toNullableString(formData.get("customerNotes"));

  const courierName = toNullableString(formData.get("courierName"));
  const trackingReference = toNullableString(formData.get("trackingReference"));
  const deliveryNotes = toNullableString(formData.get("deliveryNotes"));

  const supplierName = toNullableString(formData.get("supplierName"));
  const supplierReference = toNullableString(formData.get("supplierReference"));
  const inventoryNotes = toNullableString(formData.get("inventoryNotes"));

  await prisma.order.update({
    where: { id: orderId },
    data: {
      vendorCostCents,
      transportCostCents,
      packagingCostCents,
      vendorInvoiceRef,
      payoutNotes,
      internalNotes,
      customerNotes,
      courierName,
      trackingReference,
      deliveryNotes,
      supplierName,
      supplierReference,
      inventoryNotes,
      ...(deliveryNotes || courierName || trackingReference
        ? { deliveryUpdatedAt: new Date() }
        : {}),
      ...(inventoryNotes || supplierName || supplierReference
        ? { inventoryUpdatedAt: new Date() }
        : {}),
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
}