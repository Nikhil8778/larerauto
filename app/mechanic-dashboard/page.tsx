import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentMechanic } from "@/lib/mechanic-auth";
import LogoutButton from "./LogoutButton";
import ReferralCodeManager from "./ReferralCodeManager";
import DashboardStats from "./DashboardStats";

export default async function MechanicDashboardPage() {
  const mechanic = await getCurrentMechanic();

  if (!mechanic) {
    redirect("/mechanic-login");
  }

  if (!mechanic.isApproved) {
    redirect("/mechanic-login");
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
          <div className="mt-3">
            <Link
              href="/catalog"
              className="inline-flex rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              Browse Parts
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <DashboardStats />
      </div>

      <ReferralCodeManager />
    </div>
  );
}