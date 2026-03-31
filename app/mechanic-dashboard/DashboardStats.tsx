"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderRow = {
  id: string;
  orderNumber: string;
  totalCents: number;
  createdAt: string;
  updatedAt?: string;
  status: string;
  paymentStatus?: string;
  inventoryStatus?: string | null;
  fulfillmentStatus?: string | null;
  deliveryStatus?: string | null;
  estimatedDeliveryText?: string | null;
  inventoryCheckedAt?: string | null;
  inventoryUpdatedAt?: string | null;
  inventoryNotes?: string | null;
  courierName?: string | null;
  trackingReference?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  deliveryUpdatedAt?: string | null;
  deliveryNotes?: string | null;
};

type StatsPayload = {
  direct: {
    weekCount: number;
    weekSpendCents: number;
    monthCount: number;
    monthSpendCents: number;
    monthDiscountSavedCents: number;
  };
  referral: {
    weekCount: number;
    weekSalesCents: number;
    monthCount: number;
    monthSalesCents: number;
    monthCreditCents: number;
    pendingPayoutCents: number;
    paidPayoutCents: number;
  };
  recentDraftDirectOrders: OrderRow[];
  recentPaidDirectOrders: OrderRow[];
  recentReferredOrders: OrderRow[];
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function inventoryLabel(status?: string | null) {
  switch ((status || "").toLowerCase()) {
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

function deliveryLabel(status?: string | null) {
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

function badgeClass(value?: string | null) {
  const text = String(value || "").toLowerCase();
  const base =
    "inline-flex whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold";

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

  if (text === "confirmed") return `${base} bg-emerald-100 text-emerald-800`;
  if (text === "draft") return `${base} bg-slate-100 text-slate-700`;

  return `${base} bg-slate-100 text-slate-700`;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/mechanic/dashboard-stats");
        const data = await res.json();

        if (!res.ok || !data.success) {
          setMessage(data.message || "Failed to load stats.");
          return;
        }

        setStats(data.stats);
      } catch {
        setMessage("Failed to load stats.");
      }
    }

    load();
  }, []);

  if (message) {
    return <p className="text-sm text-red-600">{message}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-gray-600">Loading dashboard stats...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Paid Direct Orders This Week</div>
          <div className="mt-2 text-2xl font-bold">{stats.direct.weekCount}</div>
          <div className="mt-1 text-sm text-gray-600">
            Spend: {money(stats.direct.weekSpendCents)}
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Paid Direct Orders This Month</div>
          <div className="mt-2 text-2xl font-bold">{stats.direct.monthCount}</div>
          <div className="mt-1 text-sm text-gray-600">
            Spend: {money(stats.direct.monthSpendCents)}
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Referral Orders This Month</div>
          <div className="mt-2 text-2xl font-bold">{stats.referral.monthCount}</div>
          <div className="mt-1 text-sm text-gray-600">
            Sales: {money(stats.referral.monthSalesCents)}
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Referral Credit This Month</div>
          <div className="mt-2 text-2xl font-bold">
            {money(stats.referral.monthCreditCents)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Trade savings: {money(stats.direct.monthDiscountSavedCents)}
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Pending Payout</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {money(stats.referral.pendingPayoutCents)}
          </div>
          <div className="mt-1 text-sm text-gray-600">Weekly Interac due</div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Paid Payout Total</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {money(stats.referral.paidPayoutCents)}
          </div>
          <div className="mt-1 text-sm text-gray-600">Cleared commissions</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Draft Checkouts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentDraftDirectOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 pr-4">{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      <span className={badgeClass("pending")}>Awaiting Payment</span>
                    </td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                    <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/checkout?orderId=${encodeURIComponent(
                          order.id
                        )}&mode=mechanic-resume`}
                        className="inline-flex whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
                      >
                        Resume Checkout
                      </Link>
                    </td>
                  </tr>
                ))}
                {!stats.recentDraftDirectOrders.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No unpaid draft checkouts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Paid Direct Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Inventory</th>
                  <th className="py-3 pr-4">Delivery</th>
                  <th className="py-3 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPaidDirectOrders.map((order) => (
                  <tr key={order.id} className="border-b align-top">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{order.orderNumber}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={badgeClass(order.paymentStatus)}>
                        {order.paymentStatus || "paid"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="space-y-2">
                        <span className={badgeClass(order.inventoryStatus)}>
                          {inventoryLabel(order.inventoryStatus)}
                        </span>
                        <div className="max-w-[220px] text-xs text-gray-600">
                          {order.inventoryNotes || "No inventory update yet."}
                        </div>
                        <div className="text-xs text-gray-500">
                          Checked: {formatDateTime(order.inventoryCheckedAt)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="space-y-2">
                        <span className={badgeClass(order.deliveryStatus)}>
                          {deliveryLabel(order.deliveryStatus)}
                        </span>
                        <div className="text-xs text-gray-500">
                          ETA: {order.estimatedDeliveryText || "To be updated"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tracking: {order.trackingReference || "—"}
                        </div>
                        <div className="max-w-[220px] text-xs text-gray-600">
                          {order.deliveryNotes || "No delivery notes yet."}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                  </tr>
                ))}
                {!stats.recentPaidDirectOrders.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No paid direct orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Recent Referred Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 pr-4">Payment</th>
                <th className="py-3 pr-4">Inventory</th>
                <th className="py-3 pr-4">Delivery</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentReferredOrders.map((order) => (
                <tr key={order.id} className="border-b align-top">
                  <td className="py-3 pr-4">{order.orderNumber}</td>
                  <td className="py-3 pr-4">
                    <span className={badgeClass(order.paymentStatus)}>
                      {order.paymentStatus || order.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="space-y-2">
                      <span className={badgeClass(order.inventoryStatus)}>
                        {inventoryLabel(order.inventoryStatus)}
                      </span>
                      <div className="max-w-[220px] text-xs text-gray-600">
                        {order.inventoryNotes || "No inventory update yet."}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="space-y-2">
                      <span className={badgeClass(order.deliveryStatus)}>
                        {deliveryLabel(order.deliveryStatus)}
                      </span>
                      <div className="text-xs text-gray-500">
                        Tracking: {order.trackingReference || "—"}
                      </div>
                      <div className="max-w-[220px] text-xs text-gray-600">
                        {order.deliveryNotes || "No delivery notes yet."}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{money(order.totalCents)}</td>
                  <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {!stats.recentReferredOrders.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-gray-500">
                    No referred orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}