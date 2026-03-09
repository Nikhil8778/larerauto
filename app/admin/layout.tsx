import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-900 text-white">
          <div className="px-6 py-6">
            <div className="text-2xl font-black">Lare Auto Admin</div>
            <div className="mt-1 text-sm text-slate-300">
              Pricing, inventory, fitment
            </div>
          </div>

          <nav className="px-3 pb-6">
            <div className="space-y-1">
              <Link
                href="/admin"
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Dashboard
              </Link>

              <Link
                href="/admin/parts"
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Parts
              </Link>

              <Link
                href="/admin/pricing"
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Pricing
              </Link>

              <Link
                href="/admin/inventory"
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
              >
                Inventory
              </Link>
            </div>
          </nav>
        </aside>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}