import Link from "next/link";

async function getMechanics() {
  const res = await fetch("http://localhost:3000/api/admin/mechanics", {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.mechanics || [];
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

export default async function AdminMechanicsPage() {
  const mechanics = await getMechanics();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mechanics Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review mechanic accounts, direct purchases, referrals, and performance.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 text-sm"
        >
          Back to Admin
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trade %</th>
              <th className="px-4 py-3">Referral %</th>
              <th className="px-4 py-3">Direct Orders</th>
              <th className="px-4 py-3">Referred Orders</th>
              <th className="px-4 py-3">Direct Spend</th>
              <th className="px-4 py-3">Referral Sales</th>
              <th className="px-4 py-3">Referral Credit</th>
            </tr>
          </thead>
          <tbody>
            {mechanics.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="px-4 py-3 font-medium">{m.shopName}</td>
                <td className="px-4 py-3">
                  <div>{m.contactName}</div>
                  <div className="text-xs text-gray-500">{m.email}</div>
                </td>
                <td className="px-4 py-3">
                  {m.isApproved ? "Approved" : "Pending"} /{" "}
                  {m.isActive ? "Active" : "Inactive"}
                </td>
                <td className="px-4 py-3">{m.tradeDiscountPct}%</td>
                <td className="px-4 py-3">{m.referralDiscountPct}%</td>
                <td className="px-4 py-3">{m.directOrdersCount}</td>
                <td className="px-4 py-3">{m.referredOrdersCount}</td>
                <td className="px-4 py-3">{money(m.directSpendCents)}</td>
                <td className="px-4 py-3">{money(m.referralSalesCents)}</td>
                <td className="px-4 py-3">{money(m.referralCreditCents)}</td>
              </tr>
            ))}

            {!mechanics.length && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
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