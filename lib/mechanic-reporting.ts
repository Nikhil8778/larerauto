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
    directOrdersWeek,
    directOrdersMonth,
    referredOrdersWeek,
    referredOrdersMonth,
    recentDirectOrders,
    recentReferredOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
        createdAt: { gte: monthStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        referredByMechanicId: mechanicId,
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        referredByMechanicId: mechanicId,
        createdAt: { gte: monthStart },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        mechanicId,
        orderPlacedByType: "mechanic",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.findMany({
      where: {
        referredByMechanicId: mechanicId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const sum = (rows: { totalCents: number }[]) =>
    rows.reduce((acc, row) => acc + row.totalCents, 0);

  const sumField = (rows: Record<string, any>[], field: string) =>
    rows.reduce((acc, row) => acc + Number(row[field] || 0), 0);

  return {
    direct: {
      weekCount: directOrdersWeek.length,
      weekSpendCents: sum(directOrdersWeek),
      monthCount: directOrdersMonth.length,
      monthSpendCents: sum(directOrdersMonth),
      monthDiscountSavedCents: sumField(directOrdersMonth, "mechanicDiscountCents"),
    },
    referral: {
      weekCount: referredOrdersWeek.length,
      weekSalesCents: sum(referredOrdersWeek),
      monthCount: referredOrdersMonth.length,
      monthSalesCents: sum(referredOrdersMonth),
      monthCreditCents: sumField(referredOrdersMonth, "mechanicCreditCents"),
    },
    recentDirectOrders,
    recentReferredOrders,
  };
}