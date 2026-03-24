import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-CA");
}

function getOrderType(order: {
  orderPlacedByType: string | null;
  referredByMechanicId: string | null;
}) {
  if (order.orderPlacedByType === "mechanic") return "Mechanic Direct";
  if (order.orderPlacedByType === "customer" && order.referredByMechanicId) {
    return "Customer via Referral";
  }
  return "Customer Direct";
}

function badgeClass(kind: "paid" | "pending" | "mechanic" | "customer" | "referral") {
  const base = "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

  if (kind === "paid") return `${base} bg-emerald-100 text-emerald-800`;
  if (kind === "pending") return `${base} bg-amber-100 text-amber-800`;
  if (kind === "mechanic") return `${base} bg-sky-100 text-sky-800`;
  if (kind === "referral") return `${base} bg-violet-100 text-violet-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      items: true,
      mechanic: true,
      referredByMechanic: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;
  const pendingOrders = orders.filter((o) => o.paymentStatus === "pending").length;
  const mechanicDirectOrders = orders.filter(
    (o) => o.orderPlacedByType === "mechanic"
  ).length;
  const customerDirectOrders = orders.filter(
    (o) => o.orderPlacedByType === "customer" && !o.referredByMechanicId
  ).length;
  const referralOrders = orders.filter(
    (o) => o.orderPlacedByType === "customer" && !!o.referredByMechanicId
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Orders</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage mechanic, customer, and referral-based orders.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Orders
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalOrders}</div>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Paid
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-900">{paidOrders}</div>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Pending
            </div>
            <div className="mt-2 text-2xl font-black text-amber-900">{pendingOrders}</div>
          </div>

          <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
            <div className="text-xs font-bold uppercase tracking-wide text-sky-700">
              Mechanic Direct
            </div>
            <div className="mt-2 text-2xl font-black text-sky-900">
              {mechanicDirectOrders}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Customer Direct
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {customerDirectOrders}
            </div>
          </div>

          <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-200">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-700">
              Via Referral
            </div>
            <div className="mt-2 text-2xl font-black text-violet-900">
              {referralOrders}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Mechanic / Referral</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Fulfillment</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr className="border-t">
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const orderType = getOrderType(order);

                  return (
                    <tr key={order.id} className="border-t align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{order.orderNumber}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {order.id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {order.customer.firstName} {order.customer.lastName ?? ""}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {order.customer.email || "No email"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {orderType === "Mechanic Direct" ? (
                          <span className={badgeClass("mechanic")}>{orderType}</span>
                        ) : orderType === "Customer via Referral" ? (
                          <span className={badgeClass("referral")}>{orderType}</span>
                        ) : (
                          <span className={badgeClass("customer")}>{orderType}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {orderType === "Mechanic Direct" ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">
                              {order.mechanic?.shopName || "Mechanic"}
                            </div>
                            <div className="text-xs text-slate-500">
                              Direct Discount: {money(order.mechanicDiscountCents || 0)}
                            </div>
                          </div>
                        ) : orderType === "Customer via Referral" ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">
                              {order.referredByMechanic?.shopName || "Referral Mechanic"}
                            </div>
                            <div className="text-xs text-slate-500">
                              Code: {order.mechanicReferralCode || "-"}
                            </div>
                            <div className="text-xs text-slate-500">
                              Customer Discount: {money(order.referralDiscountCents || 0)}
                            </div>
                            <div className="text-xs text-slate-500">
                              Mechanic Credit: {money(order.mechanicCreditCents || 0)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500">—</div>
                        )}
                      </td>

                      <td className="px-4 py-3">{order.items.length}</td>

                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {money(order.totalCents)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={badgeClass(
                            order.paymentStatus === "paid" ? "paid" : "pending"
                          )}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {order.fulfillmentStatus}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl bg-amber-50 p-5 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
        Multiple rows for the same customer can still appear because each order is a separate
        transaction record. Older test or draft orders created before the resume-checkout fix may
        still exist in the database.
      </div>
    </div>
  );
}