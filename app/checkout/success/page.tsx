"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessInner() {
  const sp = useSearchParams();
  const orderNumber = sp.get("orderNumber") || "-";
  const invoiceNumber = sp.get("invoiceNumber") || "-";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-[28px] border border-white/40 bg-white/25 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-black text-slate-900">Order Created</h1>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Your order and invoice have been created successfully.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl bg-white/60 p-5 text-sm font-semibold text-slate-800">
          <div className="flex justify-between">
            <span>Order Number</span>
            <span>{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Invoice Number</span>
            <span>{invoiceNumber}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white"
          >
            View Orders
          </Link>
          <Link
            href="/admin/invoices"
            className="rounded-full border border-slate-900/20 bg-white/70 px-6 py-3 text-sm font-extrabold text-slate-900"
          >
            View Invoices
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading success page…</div>}>
      <SuccessInner />
    </Suspense>
  );
}