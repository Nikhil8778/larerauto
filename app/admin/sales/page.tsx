import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default async function AdminSalesPage() {
  const [orders, invoices] = await Promise.all([
    prisma.order.findMany({
      include: { customer: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: { status: "paid" },
      select: { totalCents: true },
    }),
  ]);

  const paidRevenueCents = invoices.reduce((sum, i) => sum + i.totalCents, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Sales</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Revenue, recent orders and business performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Paid Revenue</div>
          <div className="mt-3 text-3xl font-black text-slate-900">{money(paidRevenueCents)}</div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Recent Orders</div>
          <div className="mt-3 text-3xl font-black text-slate-900">{orders.length}</div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-500">Average Order Value</div>
          <div className="mt-3 text-3xl font-black text-slate-900">
            {orders.length
              ? money(
                  Math.round(
                    orders.reduce((sum, o) => sum + o.totalCents, 0) / orders.length
                  )
                )
              : money(0)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr className="border-t">
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No sales records yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    {order.customer.firstName} {order.customer.lastName ?? ""}
                  </td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3 font-semibold">{money(order.totalCents)}</td>
                  <td className="px-4 py-3">{order.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}