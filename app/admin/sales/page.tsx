import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-CA");
}

export default async function AdminSalesPage() {
  const [orders, paidInvoices] = await Promise.all([
    prisma.order.findMany({
      include: {
        customer: true,
        items: true,
        mechanic: true,
        referredByMechanic: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.invoice.findMany({
      where: { status: "paid" },
      select: { totalCents: true },
    }),
  ]);

  const paidRevenueCents = paidInvoices.reduce((sum, i) => sum + i.totalCents, 0);
  const totalTaxCents = orders.reduce((sum, o) => sum + o.taxCents, 0);
  const totalDiscountCents = orders.reduce((sum, o) => sum + o.discountCents, 0);
  const totalVendorCostCents = orders.reduce((sum, o) => sum + (o.vendorCostCents || 0), 0);
  const totalTransportCostCents = orders.reduce(
    (sum, o) => sum + (o.transportCostCents || 0),
    0
  );
  const totalPackagingCostCents = orders.reduce(
    (sum, o) => sum + (o.packagingCostCents || 0),
    0
  );
  const totalMechanicCreditCents = orders.reduce(
    (sum, o) => sum + (o.mechanicCreditCents || 0),
    0
  );

  const estimatedNetProfitCents = orders.reduce((sum, o) => {
    return (
      sum +
      (o.totalCents -
        (o.taxCents || 0) -
        (o.vendorCostCents || 0) -
        (o.transportCostCents || 0) -
        (o.packagingCostCents || 0) -
        (o.mechanicCreditCents || 0))
    );
  }, 0);

  const averageOrderValueCents = orders.length
    ? Math.round(orders.reduce((sum, o) => sum + o.totalCents, 0) / orders.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Sales</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Revenue, cost, payout and profit visibility across recent orders.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Paid Revenue</div>
          <div className="mt-3 text-3xl font-black text-slate-900">
            {money(paidRevenueCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Average Order Value</div>
          <div className="mt-3 text-3xl font-black text-slate-900">
            {money(averageOrderValueCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Total Tax Collected</div>
          <div className="mt-3 text-3xl font-black text-slate-900">
            {money(totalTaxCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">
            Estimated Net Profit
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-700">
            {money(estimatedNetProfitCents)}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Vendor Cost</div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {money(totalVendorCostCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Transport Cost</div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {money(totalTransportCostCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Packaging Cost</div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {money(totalPackagingCostCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Total Discounts</div>
          <div className="mt-3 text-2xl font-black text-amber-700">
            {money(totalDiscountCents)}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Mechanic Credit</div>
          <div className="mt-3 text-2xl font-black text-violet-700">
            {money(totalMechanicCreditCents)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Vendor Cost</th>
              <th className="px-4 py-3 font-semibold">Transport</th>
              <th className="px-4 py-3 font-semibold">Packaging</th>
              <th className="px-4 py-3 font-semibold">Mechanic Credit</th>
              <th className="px-4 py-3 font-semibold">Est. Profit</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr className="border-t">
                <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                  No sales records yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const estimatedProfit =
                  order.totalCents -
                  (order.taxCents || 0) -
                  (order.vendorCostCents || 0) -
                  (order.transportCostCents || 0) -
                  (order.packagingCostCents || 0) -
                  (order.mechanicCreditCents || 0);

                return (
                  <tr key={order.id} className="border-t align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{order.orderNumber}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {order.items.length} item(s)
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {order.customer.firstName} {order.customer.lastName ?? ""}
                    </td>

                    <td className="px-4 py-3 font-semibold">{money(order.totalCents)}</td>
                    <td className="px-4 py-3">{money(order.vendorCostCents || 0)}</td>
                    <td className="px-4 py-3">{money(order.transportCostCents || 0)}</td>
                    <td className="px-4 py-3">{money(order.packagingCostCents || 0)}</td>
                    <td className="px-4 py-3">{money(order.mechanicCreditCents || 0)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {money(estimatedProfit)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Open Order
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}