import Link from "next/link";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-14 pt-10">
      <div className="rounded-[28px] border border-white/45 bg-white/35 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Cart</h1>
        <p className="mt-2 text-sm font-medium text-slate-700">
          This is a demo cart layout (we’ll connect real items next).
        </p>

        <div className="mt-6 rounded-2xl border border-white/55 bg-white/55 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Sample Item</div>
              <div className="text-xs font-semibold text-slate-600">Alternator • 2017 Hyundai Tucson</div>
            </div>
            <div className="text-sm font-extrabold text-slate-900">$—</div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/catalog"
            className="rounded-full border border-slate-900/20 bg-white/70 px-6 py-3 text-sm font-extrabold text-slate-900 hover:bg-white"
          >
            Continue Shopping
          </Link>
          <Link
            href="/checkout"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}