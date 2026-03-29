import { prisma } from "@/lib/prisma";

export async function evaluateCustomerMechanicEligibility(customerId: string) {
  if (!customerId) return;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      isMechanicEligible: true,
      mechanicEligibleAt: true,
      companyName: true,
    },
  });

  if (!customer) return;

  const mechanicOrFilters: { email?: string; phone?: string }[] = [];

  if (customer.email) {
    mechanicOrFilters.push({ email: customer.email });
  }

  if (customer.phone) {
    mechanicOrFilters.push({ phone: customer.phone });
  }

  let existingMechanic = null;

  if (mechanicOrFilters.length > 0) {
    existingMechanic = await prisma.mechanic.findFirst({
      where: {
        OR: mechanicOrFilters,
      },
      select: { id: true },
    });
  }

  if (existingMechanic) {
    return;
  }

  const start = new Date();
  start.setDate(start.getDate() - 30);

  const paidOrdersLast30 = await prisma.order.count({
    where: {
      customerId,
      createdAt: {
        gte: start,
      },
      paymentStatus: "paid",
    },
  });

  if (paidOrdersLast30 >= 2) {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        isMechanicEligible: true,
        mechanicEligibleAt: customer.mechanicEligibleAt ?? new Date(),
      },
    });
  }
}