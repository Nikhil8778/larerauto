import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  activateMechanic,
  approveMechanic,
  deactivateMechanic,
  markMechanicCommissionsPaid,
} from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

function commissionBadge(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default async function AdminMechanicDetailPage({ params }: PageProps) {
  const { id } = await params;

  const mechanic = await prisma.mechanic.findUnique({
    where: { id },
    include: {
      referralCodes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      commissions: {
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalCents: true,
              paymentStatus: true,
              createdAt: true,
            },
          },
        },
        orderBy: { earnedAt: "desc" },
        take: 50,
      },
      directOrders: {
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      referredOrders: {
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!mechanic) {
    notFound();
  }

  const pendingCommissionCents = mechanic.commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amountCents, 0);

  const paidCommissionCents = mechanic.commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amountCents, 0);

  const directSpendCents = mechanic.directOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const referredSalesCents = mechanic.referredOrders.reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mechanic Detail</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review payout history, referral performance, and account status.
          </p>
        </div>

        <Link href="/admin/mechanics" className="rounded-xl border px-4 py-2 text-sm">
          ← Back to Mechanics
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-500">Shop</div>
          <div className="mt-1 text-lg font-semibold">{mechanic.shopName}</div>
          <div className="mt-2 text-sm text-gray-600">{mechanic.contactName}</div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-500">Contact</div>
          <div className="mt-1 text-sm">{mechanic.email}</div>
          <div className="mt-1 text-sm">{mechanic.phone || "-"}</div>
          <div className="mt-2 text-sm text-gray-600">
            {mechanic.isApproved ? "Approved" : "Pending"} / {mechanic.isActive ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-500">Pending Payout</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {money(pendingCommissionCents)}
          </div>
          <div className="mt-2 text-sm text-gray-600">Wallet: {money(mechanic.creditBalanceCents)}</div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-500">Paid Total</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {money(paidCommissionCents)}
          </div>
          <div className="mt-2 text-sm text-gray-600">Referral sales: {money(referredSalesCents)}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap gap-3">
          {!mechanic.isApproved ? (
            <form
              action={async () => {
                "use server";
                await approveMechanic(mechanic.id);
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                Approve Mechanic
              </button>
            </form>
          ) : null}

          {mechanic.isActive ? (
            <form
              action={async () => {
                "use server";
                await deactivateMechanic(mechanic.id);
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
              >
                Deactivate
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await activateMechanic(mechanic.id);
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-sky-200 px-4 py-3 text-sm font-bold text-sky-700 hover:bg-sky-50"
              >
                Activate
              </button>
            </form>
          )}

          {pendingCommissionCents > 0 ? (
            <form
              action={async () => {
                "use server";
                await markMechanicCommissionsPaid(mechanic.id, "Weekly Interac payout");
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-violet-200 px-4 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50"
              >
                Mark Weekly Paid
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
              No payout due
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Referral Codes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Used</th>
                  <th className="py-3 pr-4">Limit</th>
                  <th className="py-3 pr-4">Expires</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {mechanic.referralCodes.map((code) => (
                  <tr key={code.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">{code.code}</td>
                    <td className="py-3 pr-4">{code.usedCount}</td>
                    <td className="py-3 pr-4">{code.usageLimit ?? "∞"}</td>
                    <td className="py-3 pr-4">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : "-"}
                    </td>
                    <td className="py-3 pr-4">{code.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
                {!mechanic.referralCodes.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No referral codes generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Account Summary</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div><span className="font-semibold text-gray-900">Trade Discount:</span> {mechanic.tradeDiscountPct}%</div>
            <div><span className="font-semibold text-gray-900">Referral Discount:</span> {mechanic.referralDiscountPct}%</div>
            <div><span className="font-semibold text-gray-900">Direct Orders:</span> {mechanic.directOrders.length}</div>
            <div><span className="font-semibold text-gray-900">Direct Spend:</span> {money(directSpendCents)}</div>
            <div><span className="font-semibold text-gray-900">Referred Orders:</span> {mechanic.referredOrders.length}</div>
            <div><span className="font-semibold text-gray-900">Referral Sales:</span> {money(referredSalesCents)}</div>
            <div><span className="font-semibold text-gray-900">Wallet Credit:</span> {money(mechanic.creditBalanceCents)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Commission History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 pr-4">Order</th>
                <th className="py-3 pr-4">Earned</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Paid At</th>
                <th className="py-3 pr-4">Order Total</th>
              </tr>
            </thead>
            <tbody>
              {mechanic.commissions.map((commission) => (
                <tr key={commission.id} className="border-b">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/orders`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {commission.order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    {new Date(commission.earnedAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 font-semibold">
                    {money(commission.amountCents)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${commissionBadge(
                        commission.status
                      )}`}
                    >
                      {commission.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {commission.paidAt ? new Date(commission.paidAt).toLocaleString() : "-"}
                  </td>
                  <td className="py-3 pr-4">
                    {money(commission.order.totalCents)}
                  </td>
                </tr>
              ))}
              {!mechanic.commissions.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-gray-500">
                    No commissions found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Referred Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {mechanic.referredOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 pr-4">{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      {[order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || order.customer?.email || "-"}
                    </td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                    <td className="py-3 pr-4">{order.paymentStatus}</td>
                    <td className="py-3 pr-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!mechanic.referredOrders.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No referred orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Recent Direct Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {mechanic.directOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 pr-4">{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      {[order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || order.customer?.email || "-"}
                    </td>
                    <td className="py-3 pr-4">{money(order.totalCents)}</td>
                    <td className="py-3 pr-4">{order.paymentStatus}</td>
                    <td className="py-3 pr-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!mechanic.directOrders.length && (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No direct orders yet.
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