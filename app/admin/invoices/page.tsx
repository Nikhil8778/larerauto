import { prisma } from "@/lib/prisma";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      order: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Invoices</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Draft, send and track invoice payments.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Invoice #</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr className="border-t">
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    {invoice.customer.firstName} {invoice.customer.lastName ?? ""}
                  </td>
                  <td className="px-4 py-3">{invoice.order?.orderNumber ?? "-"}</td>
                  <td className="px-4 py-3">{invoice.items.length}</td>
                  <td className="px-4 py-3 font-semibold">{money(invoice.totalCents)}</td>
                  <td className="px-4 py-3">{invoice.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}