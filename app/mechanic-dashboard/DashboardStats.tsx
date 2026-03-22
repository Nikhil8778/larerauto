"use client";

import { useEffect, useState } from "react";

type OrderRow = {
  id: string;
  orderNumber: string;
  totalCents: number;
  createdAt: string;
  status: string;
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
  recentDirectOrders: OrderRow[];
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
          <div className="text-sm text-gray-500">Direct Orders This Week</div>
          <div className="mt-2 text-2xl font-bold">{stats.direct.weekCount}</div>
          <div className="mt-1 text-sm text-gray-600">
            Spend: {money(stats.direct.weekSpendCents)}
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Direct Orders This Month</div>
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
          <h2 className="mb-4 text-xl font-semibold">Recent Direct Orders</h2>
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
                {stats.recentDirectOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 pr-4">{order.orderNumber}</td>
                    <td className="py-3 pr-4">{order.status}</td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                    <td className="py-3 pr-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!stats.recentDirectOrders.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-500">
                      No direct orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    </div>
  );
}