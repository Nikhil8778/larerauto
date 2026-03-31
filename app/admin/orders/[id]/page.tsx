import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateOrderOpsDetails } from "./actions";

function money(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-CA");
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

function badgeClass(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();
  const base =
    "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

  if (text === "paid") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "pending") return `${base} bg-amber-100 text-amber-800`;

  if (text === "inventory_confirmed") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "inventory_check_pending") return `${base} bg-amber-100 text-amber-800`;
  if (text === "inventory_unavailable") return `${base} bg-rose-100 text-rose-800`;
  if (text === "alternate_offered") return `${base} bg-sky-100 text-sky-800`;

  if (text === "packed") return `${base} bg-indigo-100 text-indigo-800`;
  if (text === "dispatched") return `${base} bg-sky-100 text-sky-800`;
  if (text === "in_transit") return `${base} bg-amber-100 text-amber-800`;
  if (text === "delivered") return `${base} bg-emerald-100 text-emerald-800`;

  if (text === "fulfilled") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "unfulfilled") return `${base} bg-slate-100 text-slate-700`;
  if (text === "processing") return `${base} bg-blue-100 text-blue-800`;

  if (text === "mechanic direct") return `${base} bg-sky-100 text-sky-800`;
  if (text === "customer via referral") return `${base} bg-violet-100 text-violet-800`;
  if (text === "customer direct") return `${base} bg-slate-100 text-slate-700`;

  return `${base} bg-slate-100 text-slate-700`;
}

function inventoryLabel(status: string | null | undefined) {
  switch (status) {
    case "inventory_confirmed":
      return "Inventory Confirmed";
    case "inventory_unavailable":
      return "Unavailable";
    case "alternate_offered":
      return "Alternate Offered";
    case "inventory_check_pending":
    default:
      return "Pending Check";
  }
}

function deliveryLabel(status: string | null | undefined) {
  switch (status) {
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      invoices: {
        orderBy: { createdAt: "desc" },
      },
      mechanic: true,
      referredByMechanic: true,
      referralCode: true,
      quoteLeads: true,
      mechanicCommissions: true,
    },
  });

  if (!order) {
    notFound();
  }

  const orderType = getOrderType(order);
  const latestInvoice = order.invoices[0] ?? null;

  const estimatedNetProfit =
    order.totalCents -
    (order.taxCents || 0) -
    (order.vendorCostCents || 0) -
    (order.transportCostCents || 0) -
    (order.packagingCostCents || 0) -
    (order.mechanicCreditCents || 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Order {order.orderNumber}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Full order detail view for operations, inventory, referral, delivery and profit tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Orders
            </Link>

            {latestInvoice ? (
              <Link
                href={`/invoice/${latestInvoice.id}?token=${latestInvoice.customerAccessToken}`}
                target="_blank"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open Customer Invoice
              </Link>
            ) : null}

            {order.customerAccessToken ? (
              <Link
                href={`/order/${order.id}?token=${order.customerAccessToken}`}
                target="_blank"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open Customer Order Page
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Order Summary</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between gap-4">
              <span>Order Number</span>
              <span className="font-semibold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Order Type</span>
              <span className={badgeClass(orderType)}>{orderType}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status</span>
              <span className="font-semibold text-slate-900">{order.status}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Payment</span>
              <span className={badgeClass(order.paymentStatus)}>{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Fulfillment</span>
              <span className={badgeClass(order.fulfillmentStatus)}>
                {order.fulfillmentStatus}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Delivery</span>
              <span className={badgeClass(order.deliveryStatus)}>
                {deliveryLabel(order.deliveryStatus)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Inventory</span>
              <span className={badgeClass(order.inventoryStatus)}>
                {inventoryLabel(order.inventoryStatus)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Total</span>
              <span className="font-black text-slate-900">
                {money(order.totalCents, order.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Created</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Updated</span>
              <span>{formatDateTime(order.updatedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Paid At</span>
              <span>{formatDateTime(order.paidAt)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Customer</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Name
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {order.customer.firstName} {order.customer.lastName ?? ""}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Email
              </div>
              <div className="mt-1">{order.customer.email || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Phone
              </div>
              <div className="mt-1">{order.customer.phone || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                WhatsApp
              </div>
              <div className="mt-1">{order.customer.whatsappNumber || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Address
              </div>
              <div className="mt-1">
                {[order.addressLine1, order.addressLine2, order.city, order.province, order.postalCode, order.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Reply Route
              </div>
              <div className="mt-1">{order.preferredReplyChannel || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Customer Type
              </div>
              <div className="mt-1">{order.customerType || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Source Channel
              </div>
              <div className="mt-1">{order.sourceChannel || "—"}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Mechanic / Referral</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Direct Mechanic
              </div>
              <div className="mt-1">{order.mechanic?.shopName || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Referral Mechanic
              </div>
              <div className="mt-1">{order.referredByMechanic?.shopName || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Referral Code
              </div>
              <div className="mt-1">{order.mechanicReferralCode || "—"}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Mechanic Discount
              </div>
              <div className="mt-1">{money(order.mechanicDiscountCents || 0)}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Referral Discount
              </div>
              <div className="mt-1">{money(order.referralDiscountCents || 0)}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Mechanic Credit
              </div>
              <div className="mt-1">{money(order.mechanicCreditCents || 0)}</div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Commission Records
              </div>
              <div className="mt-1">{order.mechanicCommissions.length}</div>
            </div>
          </div>
        </div>
      </div>

      <form action={updateOrderOpsDetails} className="space-y-6">
        <input type="hidden" name="orderId" value={order.id} />

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">Inventory Details</h2>

            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <span>Status</span>
                <span className={badgeClass(order.inventoryStatus)}>
                  {inventoryLabel(order.inventoryStatus)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Checked At</span>
                <span>{formatDateTime(order.inventoryCheckedAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Checked By</span>
                <span>{order.inventoryCheckedBy || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Last Updated</span>
                <span>{formatDateTime(order.inventoryUpdatedAt)}</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Supplier Name
                </label>
                <input
                  name="supplierName"
                  defaultValue={order.supplierName || ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Supplier Reference
                </label>
                <input
                  name="supplierReference"
                  defaultValue={order.supplierReference || ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Inventory Notes
                </label>
                <textarea
                  name="inventoryNotes"
                  defaultValue={order.inventoryNotes || ""}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">Delivery Details</h2>

            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <span>Status</span>
                <span className={badgeClass(order.deliveryStatus)}>
                  {deliveryLabel(order.deliveryStatus)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Dispatched At</span>
                <span>{formatDateTime(order.dispatchedAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Delivered At</span>
                <span>{formatDateTime(order.deliveredAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Last Updated</span>
                <span>{formatDateTime(order.deliveryUpdatedAt)}</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Courier Name
                </label>
                <input
                  name="courierName"
                  defaultValue={order.courierName || ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tracking Reference
                </label>
                <input
                  name="trackingReference"
                  defaultValue={order.trackingReference || ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Delivery Notes
                </label>
                <textarea
                  name="deliveryNotes"
                  defaultValue={order.deliveryNotes || ""}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">Profit / Cost Control</h2>

            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <span>Customer Paid</span>
                <span className="font-semibold text-slate-900">
                  {money(order.totalCents, order.currency)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Tax Collected</span>
                <span>{money(order.taxCents, order.currency)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-black text-emerald-700">
                <span>Estimated Net Profit</span>
                <span>{money(estimatedNetProfit, order.currency)}</span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vendor Cost (cents)
                </label>
                <input
                  type="number"
                  min={0}
                  name="vendorCostCents"
                  defaultValue={order.vendorCostCents || 0}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Transport Cost (cents)
                </label>
                <input
                  type="number"
                  min={0}
                  name="transportCostCents"
                  defaultValue={order.transportCostCents || 0}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Packaging Cost (cents)
                </label>
                <input
                  type="number"
                  min={0}
                  name="packagingCostCents"
                  defaultValue={order.packagingCostCents || 0}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Vendor Invoice Ref
                </label>
                <input
                  name="vendorInvoiceRef"
                  defaultValue={order.vendorInvoiceRef || ""}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Payout Notes
                </label>
                <textarea
                  name="payoutNotes"
                  defaultValue={order.payoutNotes || ""}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-black text-slate-900">Invoice / Tokens</h2>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <span>Latest Invoice</span>
                <span>{latestInvoice?.invoiceNumber || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Invoice Status</span>
                <span>{latestInvoice?.status || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Order Access Token</span>
                <span className="max-w-[240px] truncate">{order.customerAccessToken || "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Quote Links</span>
                <span>{order.quoteLeads.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Items</h2>

          <div className="mt-4 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-black text-slate-900">{item.title}</div>
                    {item.description ? (
                      <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                    ) : null}
                    <div className="mt-2 text-sm text-slate-700">
                      {[item.year, item.make, item.model, item.engine]
                        .filter(Boolean)
                        .join(" • ") || "—"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      SKU: {item.sku || "—"} • Part Type: {item.partTypeName || "—"}
                    </div>
                  </div>

                  <div className="text-right text-sm text-slate-700">
                    <div>Qty: {item.quantity}</div>
                    <div>Unit: {money(item.unitPriceCents, order.currency)}</div>
                    <div className="mt-1 font-black text-slate-900">
                      Total: {money(item.lineTotalCents, order.currency)}
                    </div>
                  </div>
                </div>

                {item.notes ? (
                  <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    {item.notes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(order.subtotalCents, order.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Delivery</span>
              <span>{money(order.shippingCents, order.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Discount</span>
              <span>{money(order.discountCents, order.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>HST</span>
              <span>{money(order.taxCents, order.currency)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
              <span>Total</span>
              <span>{money(order.totalCents, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Notes</h2>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Internal Notes
              </label>
              <textarea
                name="internalNotes"
                defaultValue={order.internalNotes || ""}
                rows={6}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Customer Notes
              </label>
              <textarea
                name="customerNotes"
                defaultValue={order.customerNotes || ""}
                rows={6}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Save Order Details
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}