"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function normalizePostal(pc: string) {
  return pc.toUpperCase().replace(/\s+/g, "");
}

// ✅ simple delivery rules (edit anytime)
function deliveryFromPostal(postal: string) {
  const p = normalizePostal(postal);

  // Sudbury example: P3*
  if (p.startsWith("P3")) return 30;

  // KWC area (Waterloo/Kitchener/Cambridge mostly starts with N2 / N1 / N3)
  if (p.startsWith("N2") || p.startsWith("N1") || p.startsWith("N3")) return 15;

  // default
  return 30;
}

export default function CheckoutPage() {
  const sp = useSearchParams();

  const partType = sp.get("partType") || "Item";
  const itemPrice = Number(sp.get("price") || 0);
  const qty = Number(sp.get("qty") || 1);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");

  const delivery = useMemo(() => {
    if (!postal.trim()) return 0;
    return deliveryFromPostal(postal);
  }, [postal]);

  const subtotal = itemPrice * qty;
  const hst = useMemo(() => {
    // HST on (item + delivery)
    return (subtotal + delivery) * 0.13;
  }, [subtotal, delivery]);

  const total = subtotal + delivery + hst;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-slate-900">Checkout</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* LEFT */}
        <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
          <div className="text-xl font-extrabold text-slate-900">Delivery details</div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Postal code</label>
                <input
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  placeholder="e.g., P3A 1B1"
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="text-xs font-medium text-slate-600">
              Delivery charge is calculated automatically from your postal code.
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6">
          <div className="text-xl font-extrabold text-slate-900">Order summary</div>

          <div className="mt-4 space-y-2 text-sm font-semibold text-slate-800">
            <div className="flex justify-between">
              <span>Item ({partType})</span>
              <span>{money(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{delivery ? money(delivery) : "—"}</span>
            </div>

            <div className="flex justify-between">
              <span>HST (13%)</span>
              <span>{delivery ? money(hst) : "—"}</span>
            </div>

            <div className="mt-3 border-t border-slate-900/10 pt-3 flex justify-between text-base font-black">
              <span>Total</span>
              <span>{delivery ? money(total) : "—"}</span>
            </div>
          </div>

          <button
            className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={!fullName.trim() || !address.trim() || !city.trim() || !postal.trim() || itemPrice <= 0}
          >
            Confirm & Pay
          </button>

          <p className="mt-3 text-xs font-medium text-slate-600">
            Demo checkout. Next step would be payment + order confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}