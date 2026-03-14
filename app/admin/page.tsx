import { prisma } from "@/lib/prisma";

function StatCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate-600">{note}</div>
    </div>
  );
}

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export default async function AdminDashboardPage() {
  const [customerCount, orderCount, invoiceCount, openConversationCount, paidInvoices] =
    await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.invoice.count(),
      prisma.conversation.count({
        where: { status: "open" },
      }),
      prisma.invoice.findMany({
        where: { status: "paid" },
        select: { totalCents: true },
      }),
    ]);

  const paidRevenueCents = paidInvoices.reduce((sum, i) => sum + i.totalCents, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Business Dashboard
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Unified control center for sales, customers, invoices, messages and automation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Customers" value={String(customerCount)} note="CRM contacts in your system." />
        <StatCard title="Orders" value={String(orderCount)} note="All order records." />
        <StatCard title="Invoices" value={String(invoiceCount)} note="Draft, sent and paid invoices." />
        <StatCard title="Open Messages" value={String(openConversationCount)} note="Conversations needing attention." />
        <StatCard title="Paid Revenue" value={money(paidRevenueCents)} note="Total revenue from paid invoices." />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">Quick Links</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="/admin/orders" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
              Manage Orders
            </a>
            <a href="/admin/invoices" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">
              Manage Invoices
            </a>
            <a href="/admin/customers" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">
              Open CRM
            </a>
            <a href="/admin/automation" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800">
              Automation Rules
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-black text-slate-900">What’s Next</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>• Create your first customer record</div>
            <div>• Create an order with line items</div>
            <div>• Convert the order into an invoice</div>
            <div>• Add WhatsApp welcome and after-hours reply rules</div>
            <div>• Configure business settings like invoice prefix and tax</div>
          </div>
        </div>
      </div>
    </div>
  );
}