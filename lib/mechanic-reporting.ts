import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return startOfDay(d);
}

export async function getMechanicDashboardStats(mechanicId: string) {
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);

  const [
    paidDirectOrdersWeek,
    paidDirectOrdersMonth,
    referredOrdersWeek,
    referredOrdersMonth,
    recentDraftDirectOrders,
    recentPaidDirectOrders,
    recentReferredOrders,
    pendingCommissions,
    paidCommissions,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
        paymentStatus: "paid",
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
        paymentStatus: "paid",
        createdAt: { gte: monthStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        referredByMechanicId: mechanicId,
        paymentStatus: "paid",
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        referredByMechanicId: mechanicId,
        paymentStatus: "paid",
        createdAt: { gte: monthStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
        status: "draft",
        paymentStatus: "pending",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
        paymentStatus: "paid",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.findMany({
      where: {
        referredByMechanicId: mechanicId,
        paymentStatus: "paid",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.mechanicCommission.findMany({
      where: {
        mechanicId,
        status: "pending",
      },
      select: {
        amountCents: true,
      },
    }),
    prisma.mechanicCommission.findMany({
      where: {
        mechanicId,
        status: "paid",
      },
      select: {
        amountCents: true,
      },
    }),
  ]);

  const sum = (rows: { totalCents: number }[]) =>
    rows.reduce((acc, row) => acc + row.totalCents, 0);

  const sumField = (rows: Record<string, any>[], field: string) =>
    rows.reduce((acc, row) => acc + Number(row[field] || 0), 0);

  const sumAmount = (rows: { amountCents: number }[]) =>
    rows.reduce((acc, row) => acc + row.amountCents, 0);

  return {
    direct: {
      weekCount: paidDirectOrdersWeek.length,
      weekSpendCents: sum(paidDirectOrdersWeek),
      monthCount: paidDirectOrdersMonth.length,
      monthSpendCents: sum(paidDirectOrdersMonth),
      monthDiscountSavedCents: sumField(
        paidDirectOrdersMonth,
        "mechanicDiscountCents"
      ),
    },
    referral: {
      weekCount: referredOrdersWeek.length,
      weekSalesCents: sum(referredOrdersWeek),
      monthCount: referredOrdersMonth.length,
      monthSalesCents: sum(referredOrdersMonth),
      monthCreditCents: sumField(referredOrdersMonth, "mechanicCreditCents"),
      pendingPayoutCents: sumAmount(pendingCommissions),
      paidPayoutCents: sumAmount(paidCommissions),
    },
    recentDraftDirectOrders,
    recentPaidDirectOrders,
    recentReferredOrders,
  };
}