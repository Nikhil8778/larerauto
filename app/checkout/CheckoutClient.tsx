"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function normalizePostal(pc: string) {
  return pc.toUpperCase().replace(/\s+/g, "");
}

function deliveryFromPostal(postal: string) {
  const p = normalizePostal(postal);

  if (p.startsWith("P3")) return 30;
  if (p.startsWith("N2") || p.startsWith("N1") || p.startsWith("N3")) return 15;

  return 30;
}

export default function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const offerId = sp.get("offerId") || "";
  const partType = sp.get("partType") || "Item";
  const itemPrice = Number(sp.get("price") || 0);
  const qty = Number(sp.get("qty") || 1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Ontario");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Canada");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const delivery = useMemo(() => {
    if (!postal.trim()) return 0;
    return deliveryFromPostal(postal);
  }, [postal]);

  const subtotal = itemPrice * qty;

  const hst = useMemo(() => {
    return (subtotal + delivery) * 0.13;
  }, [subtotal, delivery]);

  const total = subtotal + delivery + hst;

  const estimatedDeliveryText = useMemo(() => {
    if (!postal.trim()) return "";
    return "2–4 business days";
  }, [postal]);

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    phone.trim() &&
    addressLine1.trim() &&
    city.trim() &&
    province.trim() &&
    postal.trim() &&
    country.trim() &&
    itemPrice > 0;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerId: offerId || null,
          partType,
          quantity: qty,
          itemPriceCents: Math.round(itemPrice * 100),
          deliveryCents: Math.round(delivery * 100),
          taxCents: Math.round(hst * 100),
          totalCents: Math.round(total * 100),
          fullName,
          email,
          phone,
          addressLine1,
          addressLine2,
          city,
          province,
          postalCode: postal,
          country,
          estimatedDeliveryText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to continue checkout.");
        setSubmitting(false);
        return;
      }

      router.push(
        `/payment?orderId=${encodeURIComponent(
          data.orderId
        )}&invoiceId=${encodeURIComponent(
          data.invoiceId
        )}&orderNumber=${encodeURIComponent(
          data.orderNumber
        )}&invoiceNumber=${encodeURIComponent(data.invoiceNumber)}`
      );
    } catch {
      setError("Something went wrong while preparing your payment.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black text-slate-900">Checkout</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <div className="text-xl font-extrabold text-slate-900">
            Delivery details
          </div>

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
              <label className="text-sm font-bold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Address line 1</label>
              <input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">Address line 2</label>
              <input
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Apartment, unit, suite (optional)"
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
                <label className="text-sm font-bold text-slate-700">Province</label>
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-700">Postal code</label>
                <input
                  value={postal}
                  onChange={(e) => setPostal(e.target.value)}
                  placeholder="e.g., P3A 1B1"
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="text-xs font-medium text-slate-600">
              Delivery charge is calculated automatically from your postal code.
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
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

            <div className="mt-3 flex justify-between border-t border-slate-900/10 pt-3 text-base font-black">
              <span>Total</span>
              <span>{delivery ? money(total) : "—"}</span>
            </div>
          </div>

          {estimatedDeliveryText ? (
            <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm font-medium text-slate-700">
              Tentative delivery time: {estimatedDeliveryText}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            onClick={handleSubmit}
            className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Preparing payment..." : "Confirm & Continue"}
          </button>

          <p className="mt-3 text-xs font-medium text-slate-600">
            You will enter your card details on the next secure step.
          </p>
        </div>
      </div>
    </div>
  );
}