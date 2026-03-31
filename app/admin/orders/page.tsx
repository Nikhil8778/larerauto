import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  markAlternateOffered,
  markInventoryConfirmed,
  markInventoryPending,
  markInventoryUnavailable,
  markOrderDelivered,
  markOrderDispatched,
  markOrderInTransit,
  markOrderPacked,
} from "./actions";

type SearchParams = Promise<{
  source?: string;
  reply?: string;
  customerType?: string;
  payment?: string;
  inventory?: string;
  delivery?: string;
}>;

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-CA");
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

function badgeClass(
  kind:
    | "paid"
    | "pending"
    | "mechanic"
    | "customer"
    | "referral"
    | "inventory_pending"
    | "inventory_confirmed"
    | "inventory_unavailable"
    | "alternate_offered"
    | "delivery_pending"
    | "packed"
    | "dispatched"
    | "in_transit"
    | "delivered"
    | "email"
    | "whatsapp"
    | "platform"
    | "dashboard"
    | "retail"
    | "mechanic_prospect"
    | "approved_mechanic"
) {
  const base =
    "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap";

  if (kind === "paid") return `${base} bg-emerald-100 text-emerald-800`;
  if (kind === "pending") return `${base} bg-amber-100 text-amber-800`;
  if (kind === "mechanic") return `${base} bg-sky-100 text-sky-800`;
  if (kind === "referral") return `${base} bg-violet-100 text-violet-800`;
  if (kind === "inventory_pending") return `${base} bg-amber-100 text-amber-800`;
  if (kind === "inventory_confirmed") return `${base} bg-emerald-100 text-emerald-800`;
  if (kind === "inventory_unavailable") return `${base} bg-rose-100 text-rose-800`;
  if (kind === "alternate_offered") return `${base} bg-blue-100 text-blue-800`;

  if (kind === "delivery_pending") return `${base} bg-slate-100 text-slate-700`;
  if (kind === "packed") return `${base} bg-indigo-100 text-indigo-800`;
  if (kind === "dispatched") return `${base} bg-sky-100 text-sky-800`;
  if (kind === "in_transit") return `${base} bg-amber-100 text-amber-800`;
  if (kind === "delivered") return `${base} bg-emerald-100 text-emerald-800`;

  if (kind === "email") return `${base} bg-sky-100 text-sky-700`;
  if (kind === "whatsapp") return `${base} bg-emerald-100 text-emerald-700`;
  if (kind === "platform") return `${base} bg-violet-100 text-violet-700`;
  if (kind === "dashboard") return `${base} bg-amber-100 text-amber-700`;
  if (kind === "retail") return `${base} bg-slate-100 text-slate-700`;
  if (kind === "mechanic_prospect") return `${base} bg-violet-100 text-violet-700`;
  if (kind === "approved_mechanic") return `${base} bg-amber-100 text-amber-700`;

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

function inventoryBadge(status: string | null | undefined) {
  switch (status) {
    case "inventory_confirmed":
      return badgeClass("inventory_confirmed");
    case "inventory_unavailable":
      return badgeClass("inventory_unavailable");
    case "alternate_offered":
      return badgeClass("alternate_offered");
    case "inventory_check_pending":
    default:
      return badgeClass("inventory_pending");
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

function deliveryBadge(status: string | null | undefined) {
  switch (status) {
    case "packed":
      return badgeClass("packed");
    case "dispatched":
      return badgeClass("dispatched");
    case "in_transit":
      return badgeClass("in_transit");
    case "delivered":
      return badgeClass("delivered");
    case "pending":
    default:
      return badgeClass("delivery_pending");
  }
}

function replyBadge(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "email") return badgeClass("email");
  if (text === "whatsapp") return badgeClass("whatsapp");
  if (text === "platform") return badgeClass("platform");
  if (text === "dashboard") return badgeClass("dashboard");

  return "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-700";
}

function customerTypeBadge(value: string | null | undefined) {
  const text = String(value || "").toLowerCase();

  if (text === "retail") return badgeClass("retail");
  if (text === "mechanic_prospect") return badgeClass("mechanic_prospect");
  if (text === "approved_mechanic") return badgeClass("approved_mechanic");

  return "inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-700";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const source = sp.source?.trim() || "";
  const reply = sp.reply?.trim() || "";
  const customerType = sp.customerType?.trim() || "";
  const payment = sp.payment?.trim() || "";
  const inventory = sp.inventory?.trim() || "";
  const delivery = sp.delivery?.trim() || "";

  const where = {
    ...(source ? { sourceChannel: source } : {}),
    ...(reply ? { preferredReplyChannel: reply } : {}),
    ...(customerType ? { customerType } : {}),
    ...(payment ? { paymentStatus: payment } : {}),
    ...(inventory ? { inventoryStatus: inventory } : {}),
    ...(delivery ? { deliveryStatus: delivery } : {}),
  };

  const orders = await prisma.order.findMany({
    where,
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
  const pendingInventoryChecks = orders.filter(
    (o) => o.inventoryStatus === "inventory_check_pending"
  ).length;
  const pendingDelivery = orders.filter(
    (o) => (o.deliveryStatus || "pending") !== "delivered"
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Orders</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage customer, mechanic, referral, inventory verification, and delivery workflow.
        </p>

        <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            name="source"
            defaultValue={source}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Sources</option>
            <option value="website">website</option>
            <option value="seo">seo</option>
            <option value="google_products">google_products</option>
            <option value="whatsapp_campaign">whatsapp_campaign</option>
            <option value="mechanic_dashboard">mechanic_dashboard</option>
            <option value="facebook_marketplace">facebook_marketplace</option>
            <option value="facebook">facebook</option>
            <option value="instagram">instagram</option>
            <option value="tiktok">tiktok</option>
            <option value="kijiji">kijiji</option>
            <option value="karrot">karrot</option>
          </select>

          <select
            name="reply"
            defaultValue={reply}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Reply Routes</option>
            <option value="email">email</option>
            <option value="whatsapp">whatsapp</option>
            <option value="platform">platform</option>
            <option value="dashboard">dashboard</option>
          </select>

          <select
            name="customerType"
            defaultValue={customerType}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Customer Types</option>
            <option value="retail">retail</option>
            <option value="mechanic_prospect">mechanic_prospect</option>
            <option value="approved_mechanic">approved_mechanic</option>
          </select>

          <select
            name="payment"
            defaultValue={payment}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Payment Status</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
          </select>

          <select
            name="inventory"
            defaultValue={inventory}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Inventory Status</option>
            <option value="inventory_check_pending">inventory_check_pending</option>
            <option value="inventory_confirmed">inventory_confirmed</option>
            <option value="inventory_unavailable">inventory_unavailable</option>
            <option value="alternate_offered">alternate_offered</option>
          </select>

          <select
            name="delivery"
            defaultValue={delivery}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All Delivery Status</option>
            <option value="pending">pending</option>
            <option value="packed">packed</option>
            <option value="dispatched">dispatched</option>
            <option value="in_transit">in_transit</option>
            <option value="delivered">delivered</option>
          </select>

          <div className="md:col-span-2 xl:col-span-6 flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            >
              Apply Filters
            </button>
            <a
              href="/admin/orders"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Reset
            </a>
          </div>
        </form>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-8">
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

          <div className="rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-200">
            <div className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Inventory Pending
            </div>
            <div className="mt-2 text-2xl font-black text-orange-900">
              {pendingInventoryChecks}
            </div>
          </div>

          <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
            <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">
              Delivery Open
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-900">
              {pendingDelivery}
            </div>
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
                <th className="px-4 py-3 font-semibold">Reply Route</th>
                <th className="px-4 py-3 font-semibold">Customer Type</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Inventory</th>
                <th className="px-4 py-3 font-semibold">Delivery</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr className="border-t">
                  <td colSpan={14} className="px-4 py-10 text-center text-slate-500">
                    No orders found.
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
                        <div className="mt-1 text-xs text-slate-500">
                          {order.customer.phone || "No phone"}
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

                      <td className="px-4 py-3">
                        {order.preferredReplyChannel ? (
                          <div className="space-y-1">
                            <span className={replyBadge(order.preferredReplyChannel)}>
                              {order.preferredReplyChannel}
                            </span>
                            <div className="text-xs text-slate-500">
                              Last channel: {order.lastCustomerChannel || "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {order.customerType ? (
                          <span className={customerTypeBadge(order.customerType)}>
                            {order.customerType}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {order.sourceChannel ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {order.sourceChannel}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                        <div className="mt-1 text-xs text-slate-500">
                          {order.utmSource || order.utmMedium || order.utmCampaign
                            ? [order.utmSource, order.utmMedium, order.utmCampaign]
                                .filter(Boolean)
                                .join(" / ")
                            : "No UTM"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{order.items.length}</div>
                        <div className="mt-1 space-y-1">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="text-xs text-slate-500">
                              {item.title} × {item.quantity}
                            </div>
                          ))}
                          {order.items.length > 3 ? (
                            <div className="text-xs text-slate-400">
                              + {order.items.length - 3} more
                            </div>
                          ) : null}
                        </div>
                      </td>

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

                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <span className={inventoryBadge(order.inventoryStatus)}>
                            {inventoryLabel(order.inventoryStatus)}
                          </span>

                          <div className="text-xs text-slate-500">
                            Supplier: {order.supplierName || "Logel's"}
                          </div>

                          <div className="text-xs text-slate-500">
                            Checked: {formatDateTime(order.inventoryCheckedAt)}
                          </div>

                          <div className="text-xs text-slate-500">
                            Updated: {formatDateTime(order.inventoryUpdatedAt)}
                          </div>

                          <div className="text-xs text-slate-500">
                            Ref: {order.supplierReference || "—"}
                          </div>

                          <div className="max-w-[220px] text-xs text-slate-500">
                            {order.inventoryNotes || "No inventory notes yet."}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <span className={deliveryBadge(order.deliveryStatus)}>
                            {deliveryLabel(order.deliveryStatus)}
                          </span>

                          <div className="text-xs text-slate-500">
                            Courier: {order.courierName || "—"}
                          </div>

                          <div className="text-xs text-slate-500">
                            Tracking: {order.trackingReference || "—"}
                          </div>

                          <div className="text-xs text-slate-500">
                            Dispatched: {formatDateTime(order.dispatchedAt)}
                          </div>

                          <div className="text-xs text-slate-500">
                            Delivered: {formatDateTime(order.deliveredAt)}
                          </div>

                          <div className="text-xs text-slate-500">
                            Updated: {formatDateTime(order.deliveryUpdatedAt)}
                          </div>

                          <div className="max-w-[220px] text-xs text-slate-500">
                            {order.deliveryNotes || "No delivery notes yet."}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-4 py-3">
  <div className="flex min-w-[200px] flex-col gap-2">
    <Link
      href={`/admin/orders/${order.id}`}
      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
    >
      Open Order
    </Link>

    <form
      action={async () => {
        "use server";
        await markInventoryPending(order.id, "Stock verification in progress.");
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
      >
        Mark Pending
      </button>
    </form>

    <form
      action={async () => {
        "use server";
        await markInventoryConfirmed(
          order.id,
          "Stock verified and available for processing."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
      >
        Confirm Stock
      </button>
    </form>

    <form
      action={async () => {
        "use server";
        await markInventoryUnavailable(
          order.id,
          "Currently unavailable during stock verification."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
      >
        Mark Unavailable
      </button>
    </form>

    <form
      action={async () => {
        "use server";
        await markAlternateOffered(
          order.id,
          "Alternate option is being prepared for customer review."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
      >
        Offer Alternate
      </button>
    </form>

    <div className="my-1 border-t border-slate-200" />

    <form
      action={async () => {
        "use server";
        await markOrderPacked(
          order.id,
          "Your order has been packed and is being prepared for dispatch."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
      >
        Mark Packed
      </button>
    </form>

    <form
      action={async () => {
        "use server";
        await markOrderDispatched(
          order.id,
          "Your order has been dispatched from our side."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
      >
        Mark Dispatched
      </button>
    </form>

    <form
      action={async () => {
        "use server";
        await markOrderInTransit(
          order.id,
          "Your order is currently in transit."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
      >
        Mark In Transit
      </button>
    </form>

    <form
      action={async () => {
        "use server";
        await markOrderDelivered(
          order.id,
          "Your order has been delivered."
        );
      }}
    >
      <button
        type="submit"
        className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
      >
        Mark Delivered
      </button>
    </form>
  </div>
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
        Customer-facing wording should remain polished. A good standard line is:
        <span className="font-bold">
          {" "}
          “Pricing is confirmed. Inventory availability is currently being verified,
          and we will update you shortly.”
        </span>
      </div>
    </div>
  );
}