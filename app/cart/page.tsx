"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCart, removeFromCart, updateCartQty, type CartItem } from "@/lib/cart";

function money(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  function reloadCart() {
    setItems(getCart());
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.itemPrice * item.quantity, 0);
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-4xl font-black text-slate-900">Your Cart</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Review your selected parts before checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-2xl font-black text-slate-900">Cart is empty</div>
          <p className="mt-3 text-sm text-slate-600">
            Add a part from the quote result or catalog page.
          </p>

          <Link
            href="/catalog"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.offerId}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-xs font-bold text-slate-500">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full rounded-3xl object-cover"
                      />
                    ) : (
                      "No image"
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-xl font-black text-slate-900">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-600">
                      {item.partType}
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      {[item.year, item.make, item.model, item.engine]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>

                    <div className="mt-3 text-lg font-extrabold text-slate-900">
                      {money(item.itemPrice)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">Qty</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        updateCartQty(item.offerId, Number(e.target.value || 1));
                        reloadCart();
                      }}
                      className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-slate-500">Line total</div>
                    <div className="text-lg font-black text-slate-900">
                      {money(item.itemPrice * item.quantity)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      removeFromCart(item.offerId);
                      reloadCart();
                    }}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </button>

                  <Link
                    href={`/checkout?offerId=${encodeURIComponent(
                      item.offerId
                    )}&partType=${encodeURIComponent(
                      item.partType
                    )}&price=${encodeURIComponent(
                      String(item.itemPrice)
                    )}&qty=${encodeURIComponent(String(item.quantity))}${
                      item.year ? `&year=${encodeURIComponent(item.year)}` : ""
                    }${item.make ? `&make=${encodeURIComponent(item.make)}` : ""}${
                      item.model ? `&model=${encodeURIComponent(item.model)}` : ""
                    }${item.engine ? `&engine=${encodeURIComponent(item.engine)}` : ""}${
                      item.vin ? `&vin=${encodeURIComponent(item.vin)}` : ""
                    }${
                      item.utmSource
                        ? `&utm_source=${encodeURIComponent(item.utmSource)}`
                        : ""
                    }${
                      item.utmMedium
                        ? `&utm_medium=${encodeURIComponent(item.utmMedium)}`
                        : ""
                    }${
                      item.utmCampaign
                        ? `&utm_campaign=${encodeURIComponent(item.utmCampaign)}`
                        : ""
                    }${
                      item.sourceChannel
                        ? `&source_channel=${encodeURIComponent(item.sourceChannel)}`
                        : ""
                    }`}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                  >
                    Checkout This Item
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-black text-slate-900">Cart Summary</div>

            <div className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Items</span>
              <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>

            <p className="mt-4 text-xs font-medium text-slate-500">
              Delivery and HST are calculated during checkout.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/checkout?mode=cart"
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
              >
                Checkout All Items
              </Link>

              <Link
                href="/catalog"
                className="inline-flex text-sm font-bold text-slate-700 hover:text-slate-900"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}