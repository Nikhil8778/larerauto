import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  activateMechanic,
  approveMechanic,
  deactivateMechanic,
  markMechanicCommissionsPaid,
} from "./actions";

export const dynamic = "force-dynamic";

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

export default async function AdminMechanicsPage() {
  const mechanics = await prisma.mechanic.findMany({
    include: {
      directOrders: {
        select: {
          totalCents: true,
        },
      },
      referredOrders: {
        select: {
          totalCents: true,
        },
      },
      commissions: {
        select: {
          id: true,
          amountCents: true,
          status: true,
          earnedAt: true,
          paidAt: true,
        },
      },
    },
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
  });

  const rows = mechanics.map((m) => {
    const directOrdersCount = m.directOrders.length;
    const referredOrdersCount = m.referredOrders.length;
    const directSpendCents = m.directOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const referralSalesCents = m.referredOrders.reduce((sum, order) => sum + order.totalCents, 0);

    const pendingCommissionCents = m.commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.amountCents, 0);

    const paidCommissionCents = m.commissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amountCents, 0);

    return {
      ...m,
      directOrdersCount,
      referredOrdersCount,
      directSpendCents,
      referralSalesCents,
      referralCreditCents: m.creditBalanceCents,
      pendingCommissionCents,
      paidCommissionCents,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mechanics Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review mechanic accounts, approve applicants, and track direct and referral performance.
          </p>
        </div>

        <Link href="/admin" className="rounded-xl border px-4 py-2 text-sm">
          Back to Admin
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trade %</th>
              <th className="px-4 py-3">Customer Referral %</th>
              <th className="px-4 py-3">Mechanic Earn %</th>
              <th className="px-4 py-3">Direct Orders</th>
              <th className="px-4 py-3">Referred Orders</th>
              <th className="px-4 py-3">Direct Spend</th>
              <th className="px-4 py-3">Referral Sales</th>
              <th className="px-4 py-3">Pending Payout</th>
              <th className="px-4 py-3">Paid Total</th>
              <th className="px-4 py-3">Wallet Credit</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b align-top">
                <td className="px-4 py-3 font-medium">{m.shopName}</td>

                <td className="px-4 py-3">
                  <div>{m.contactName}</div>
                  <div className="text-xs text-gray-500">{m.email}</div>
                  <div className="text-xs text-gray-500">{m.phone || "-"}</div>
                </td>

                <td className="px-4 py-3">
                  <div>{m.isApproved ? "Approved" : "Pending"}</div>
                  <div className="text-xs text-gray-500">
                    {m.isActive ? "Active" : "Inactive"}
                  </div>
                </td>

                <td className="px-4 py-3">{m.tradeDiscountPct}%</td>
                <td className="px-4 py-3">{m.referralDiscountPct}%</td>
                <td className="px-4 py-3">8%</td>
                <td className="px-4 py-3">{m.directOrdersCount}</td>
                <td className="px-4 py-3">{m.referredOrdersCount}</td>
                <td className="px-4 py-3">{money(m.directSpendCents)}</td>
                <td className="px-4 py-3">{money(m.referralSalesCents)}</td>
                <td className="px-4 py-3 font-semibold text-amber-700">
                  {money(m.pendingCommissionCents)}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-700">
                  {money(m.paidCommissionCents)}
                </td>
                <td className="px-4 py-3 font-semibold text-sky-700">
                  {money(m.referralCreditCents)}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/admin/mechanics/${m.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Open Detail
                    </Link>

                    {!m.isApproved ? (
                      <form
                        action={async () => {
                          "use server";
                          await approveMechanic(m.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                      </form>
                    ) : null}

                    {m.isActive ? (
                      <form
                        action={async () => {
                          "use server";
                          await deactivateMechanic(m.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="w-full rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                        >
                          Deactivate
                        </button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await activateMechanic(m.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="w-full rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
                        >
                          Activate
                        </button>
                      </form>
                    )}

                    {m.pendingCommissionCents > 0 ? (
                      <form
                        action={async () => {
                          "use server";
                          await markMechanicCommissionsPaid(m.id, "Weekly Interac payout");
                        }}
                      >
                        <button
                          type="submit"
                          className="w-full rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50"
                        >
                          Mark Weekly Paid
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-gray-400">No payout due</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                  No mechanics found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}