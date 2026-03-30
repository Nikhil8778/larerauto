"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
    },
  });

  revalidatePath("/admin/orders");
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