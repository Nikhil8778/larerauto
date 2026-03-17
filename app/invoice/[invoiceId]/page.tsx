import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function moneyFromCents(cents: number, currency = "CAD") {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency,
  });
}

export default async function CustomerInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { invoiceId } = await params;
  const sp = await searchParams;
  const token = sp.token ?? "";

  if (!token) {
    notFound();
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerAccessToken: token,
    },
    include: {
      customer: true,
      items: true,
      order: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const customerName =
    [invoice.customer.firstName, invoice.customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Customer";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-[28px] border border-white/40 bg-white/25 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900">Invoice</h1>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Invoice details for {customerName}
            </p>
          </div>

          <div className="rounded-2xl bg-white/60 px-5 py-4 text-sm font-semibold text-slate-800">
            <div>Invoice #: {invoice.invoiceNumber}</div>
            <div className="mt-1">Order #: {invoice.order?.orderNumber ?? "-"}</div>
            <div className="mt-1 capitalize">Status: {invoice.status}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/60 p-5">
            <h2 className="text-lg font-black text-slate-900">Billed To</h2>
            <div className="mt-4 space-y-1 text-sm font-medium text-slate-800">
              <div>{customerName}</div>
              {invoice.customer.email ? <div>{invoice.customer.email}</div> : null}
              {invoice.customer.phone ? <div>{invoice.customer.phone}</div> : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white/60 p-5">
            <h2 className="text-lg font-black text-slate-900">Payment Info</h2>
            <div className="mt-4 space-y-2 text-sm font-semibold text-slate-800">
              <div className="flex justify-between">
                <span>Paid At</span>
                <span>
                  {invoice.paidAt
                    ? new Date(invoice.paidAt).toLocaleString("en-CA")
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reference</span>
                <span>{invoice.paymentReference ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/60 p-5">
          <h2 className="text-lg font-black text-slate-900">Invoice Items</h2>
          <div className="mt-4 space-y-4">
            {invoice.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      {item.title}
                    </div>
                    {item.description ? (
                      <div className="mt-1 text-sm text-slate-600">
                        {item.description}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right text-sm font-semibold text-slate-800">
                    <div>Qty: {item.quantity}</div>
                    <div>
                      Unit: {moneyFromCents(item.unitPriceCents, invoice.currency)}
                    </div>
                    <div className="mt-1 font-black">
                      Total: {moneyFromCents(item.lineTotalCents, invoice.currency)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{moneyFromCents(invoice.subtotalCents, invoice.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Delivery</span>
              <span>{moneyFromCents(invoice.shippingCents, invoice.currency)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>HST</span>
              <span>{moneyFromCents(invoice.taxCents, invoice.currency)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
              <span>Total Paid</span>
              <span>{moneyFromCents(invoice.totalCents, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}