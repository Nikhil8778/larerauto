import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import LogoutButton from "./LogoutButton";
import DashboardStats from "./DashboardStats";
import {
  deactivateReferralCode,
  generateMechanicReferralCode,
} from "./actions";

function badgeClass(
  isActive: boolean,
  expiresAt: Date | null,
  usedCount: number,
  usageLimit: number | null
) {
  if (!isActive) return "bg-slate-100 text-slate-700";
  if (expiresAt && expiresAt < new Date()) return "bg-rose-100 text-rose-700";
  if (usageLimit !== null && usedCount >= usageLimit)
    return "bg-violet-100 text-violet-700";
  return "bg-emerald-100 text-emerald-700";
}

function badgeText(
  isActive: boolean,
  expiresAt: Date | null,
  usedCount: number,
  usageLimit: number | null
) {
  if (!isActive) return "inactive";
  if (expiresAt && expiresAt < new Date()) return "expired";
  if (usageLimit !== null && usedCount >= usageLimit) return "used";
  return "active";
}

export default async function MechanicDashboardPage() {
  const currentMechanic = await getCurrentMechanic();

  if (!currentMechanic) {
    redirect("/mechanic-login");
  }

  const mechanic = await prisma.mechanic.findUnique({
    where: { id: currentMechanic.id },
    include: {
      referralCodes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!mechanic) {
    redirect("/mechanic-login");
  }

  if (!mechanic.isApproved) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mechanic Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your signup is under review.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-900">Approval Pending</h2>
          <p className="mt-2 text-sm text-amber-800">
            Lare Auto has received your signup. Once approved, you will be able to
            generate single-use referral codes and access mechanic benefits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mechanic Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome, {mechanic.contactName}. Your trade discount is{" "}
            <strong>{mechanic.tradeDiscountPct}%</strong> on item price only.
          </p>
          <p className="text-sm text-gray-600">
            Customer referral discount is{" "}
            <strong>{mechanic.referralDiscountPct}%</strong> on item price only.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            You can monitor payment, inventory verification, and fulfillment updates
            for your direct and referred business below.
          </p>
        </div>

        <LogoutButton />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Shop</div>
          <div className="mt-1 text-lg font-semibold">{mechanic.shopName}</div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Contact</div>
          <div className="mt-1 text-lg font-semibold">{mechanic.contactName}</div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Email</div>
          <div className="mt-1 text-lg font-semibold">{mechanic.email}</div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Quick Action</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/catalog"
              className="inline-flex rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              Browse Parts
            </Link>
            <Link
              href="/quote"
              className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800"
            >
              Instant Quote
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <DashboardStats />
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Single-Use Referral Codes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Generate a fresh referral code for each customer. Each code works once
              and expires in 7 days.
            </p>
          </div>

          <form action={generateMechanicReferralCode}>
            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
            >
              Generate New Code
            </button>
          </form>
        </div>

        {mechanic.referralCodes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed p-6 text-sm text-gray-500">
            No referral codes generated yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Customer Discount</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {mechanic.referralCodes.map((code) => (
                  <tr key={code.id} className="border-b">
                    <td className="px-4 py-3 font-bold tracking-wide">{code.code}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(
                          code.isActive,
                          code.expiresAt,
                          code.usedCount,
                          code.usageLimit
                        )}`}
                      >
                        {badgeText(
                          code.isActive,
                          code.expiresAt,
                          code.usedCount,
                          code.usageLimit
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">{code.customerDiscountPct}%</td>
                    <td className="px-4 py-3">
                      {code.usedCount} / {code.usageLimit ?? "∞"}
                    </td>
                    <td className="px-4 py-3">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(code.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {code.isActive ? (
                        <form
                          action={async () => {
                            "use server";
                            await deactivateReferralCode(code.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                          >
                            Deactivate
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-gray-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}