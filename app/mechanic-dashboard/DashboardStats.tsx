"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderRow = {
  id: string;
  orderNumber: string;
  totalCents: number;
  createdAt: string;
  status: string;
  paymentStatus?: string;
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
  };
  recentDraftDirectOrders: OrderRow[];
  recentPaidDirectOrders: OrderRow[];
  recentReferredOrders: OrderRow[];
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                      <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-800">
                        Awaiting Payment
                      </span>
                    </td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                    <td className="py-3 pr-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
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
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPaidDirectOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 pr-4">{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-800">
                        Paid / Confirmed
                      </span>
                    </td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                    <td className="py-3 pr-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!stats.recentPaidDirectOrders.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-500">
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
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentReferredOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-3 pr-4">{order.orderNumber}</td>
                  <td className="py-3 pr-4">{order.status}</td>
                  <td className="py-3 pr-4">{money(order.totalCents)}</td>
                  <td className="py-3 pr-4">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!stats.recentReferredOrders.length && (
                <tr>
                  <td colSpan={4} className="py-4 text-gray-500">
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