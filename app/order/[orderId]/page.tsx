import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function moneyFromCents(cents: number, currency = "CAD") {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency,
  });
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-CA");
}

function deliveryLabel(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "packed":
      return "Packed";
    case "dispatched":
      return "Dispatched";
    case "in_transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "pending":
    default:
      return "Pending";
  }
}

function badgeClass(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();
  const base =
    "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

  if (text === "paid") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "pending") return `${base} bg-amber-100 text-amber-800`;
  if (text === "fulfilled") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "processing") return `${base} bg-sky-100 text-sky-800`;
  if (text === "unfulfilled") return `${base} bg-slate-100 text-slate-700`;

  if (text === "packed") return `${base} bg-indigo-100 text-indigo-800`;
  if (text === "dispatched") return `${base} bg-sky-100 text-sky-800`;
  if (text === "in_transit") return `${base} bg-amber-100 text-amber-800`;
  if (text === "delivered") return `${base} bg-emerald-100 text-emerald-800`;

  return `${base} bg-slate-100 text-slate-700`;
}

export default async function CustomerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderId } = await params;
  const sp = await searchParams;
  const token = sp.token ?? "";

  if (!token) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerAccessToken: token,
    },
    include: {
      items: true,
      customer: true,
    },
  });

  if (!order) {
    notFound();
  }

  const customerName =
    [order.customer.firstName, order.customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Customer";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-[28px] border border-white/40 bg-white/25 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-black text-slate-900">Your Order</h1>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Order details for {customerName}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/60 p-5">
            <h2 className="text-lg font-black text-slate-900">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm font-semibold text-slate-800">
              <div className="flex justify-between">
                <span>Order Number</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className={badgeClass(order.paymentStatus)}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment</span>
                <span className={badgeClass(order.fulfillmentStatus)}>
                  {order.fulfillmentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Paid</span>
                <span>{moneyFromCents(order.totalCents, order.currency)}</span>
              </div>
              {order.estimatedDeliveryText ? (
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span>{order.estimatedDeliveryText}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 p-5">
            <h2 className="text-lg font-black text-slate-900">Delivery Address</h2>
            <div className="mt-4 space-y-1 text-sm font-medium text-slate-800">
              <div>{customerName}</div>
              {order.addressLine1 ? <div>{order.addressLine1}</div> : null}
              {order.addressLine2 ? <div>{order.addressLine2}</div> : null}
              <div>
                {[order.city, order.province, order.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {order.country ? <div>{order.country}</div> : null}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/60 p-5">
          <h2 className="text-lg font-black text-slate-900">Delivery Tracking</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="text-sm font-bold text-slate-700">Delivery Status</div>
              <div className="mt-2">
                <span className={badgeClass(order.deliveryStatus)}>
                  {deliveryLabel(order.deliveryStatus)}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between gap-3">
                  <span>Courier</span>
                  <span>{order.courierName || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Tracking Ref</span>
                  <span>{order.trackingReference || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Dispatched</span>
                  <span>{formatDateTime(order.dispatchedAt)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Delivered</span>
                  <span>{formatDateTime(order.deliveredAt)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Last Updated</span>
                  <span>{formatDateTime(order.deliveryUpdatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="text-sm font-bold text-slate-700">Delivery Notes</div>
              <div className="mt-3 text-sm text-slate-700">
                {order.deliveryNotes ||
                  "No delivery notes yet. We will keep you updated as your order progresses."}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/60 p-5">
          <h2 className="text-lg font-black text-slate-900">Items</h2>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      {item.title}
                    </div>
                    {item.description ? (
                      <div className="mt-1 text-sm text-slate-600">
                        {item.description}
                      </div>
                    ) : null}
                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {[item.year, item.make, item.model, item.engine]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  </div>

                  <div className="text-right text-sm font-semibold text-slate-800">
                    <div>Qty: {item.quantity}</div>
                    <div>
                      Unit: {moneyFromCents(item.unitPriceCents, order.currency)}
                    </div>
                    <div className="mt-1 font-black">
                      Total: {moneyFromCents(item.lineTotalCents, order.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{moneyFromCents(order.subtotalCents, order.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Delivery</span>
              <span>{moneyFromCents(order.shippingCents, order.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>HST</span>
              <span>{moneyFromCents(order.taxCents, order.currency)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
              <span>Total</span>
              <span>{moneyFromCents(order.totalCents, order.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}