import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Manage parts, pricing, inventory, and future vendor syncs.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/parts"
          className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="text-lg font-black text-slate-900">Parts</div>
          <p className="mt-2 text-sm text-slate-600">
            View all fitment-linked parts and their prices.
          </p>
        </Link>

        <Link
          href="/admin/pricing"
          className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="text-lg font-black text-slate-900">Pricing</div>
          <p className="mt-2 text-sm text-slate-600">
            Compare vendor prices and calculate website price.
          </p>
        </Link>

        <Link
          href="/admin/inventory"
          className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="text-lg font-black text-slate-900">Inventory</div>
          <p className="mt-2 text-sm text-slate-600">
            Update stock counts and track availability.
          </p>
        </Link>
      </div>
    </div>
  );
}