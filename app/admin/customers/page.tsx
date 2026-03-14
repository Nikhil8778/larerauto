import { prisma } from "@/lib/prisma";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: {
        select: {
          orders: true,
          invoices: true,
          conversations: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Customers</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Customer CRM with contacts, notes and order history visibility.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Invoices</th>
              <th className="px-4 py-3 font-semibold">Messages</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">
                    {customer.firstName} {customer.lastName ?? ""}
                  </td>
                  <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                  <td className="px-4 py-3">{customer.email ?? "-"}</td>
                  <td className="px-4 py-3">{customer._count.orders}</td>
                  <td className="px-4 py-3">{customer._count.invoices}</td>
                  <td className="px-4 py-3">{customer._count.conversations}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}