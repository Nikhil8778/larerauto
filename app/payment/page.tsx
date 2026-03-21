"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    Square?: {
      payments: (
        applicationId: string,
        locationId: string
      ) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{
            status: string;
            token?: string;
            errors?: Array<{ message?: string }>;
          }>;
        }>;
      }>;
    };
  }
}

type PreparedState = {
  appId: string;
  locationId: string;
  amountCents: number;
};

function moneyFromCents(cents: number) {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

function PaymentInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const orderId = sp.get("orderId") || "";
  const invoiceId = sp.get("invoiceId") || "";
  const orderNumber = sp.get("orderNumber") || "";
  const invoiceNumber = sp.get("invoiceNumber") || "";

  const [prepared, setPrepared] = useState<PreparedState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);

  const cardRef = useRef<any>(null);
  const cardAttachedRef = useRef(false);

  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://sandbox.web.squarecdn.com/v1/square.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError("Unable to load secure payment form.");
    document.body.appendChild(script);
  }, []);

  async function preparePayment() {
    setLoading(true);
    setError("");

    try {
      const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";

      if (!appId || !locationId) {
        setError("Square public configuration is missing.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/orders/${orderId}/summary`, {
        method: "GET",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to load payment summary.");
        setLoading(false);
        return;
      }

      setPrepared({
        appId,
        locationId,
        amountCents: data.totalCents,
      });

      if (!window.Square) {
        setError("Secure payment library is not available.");
        setLoading(false);
        return;
      }

      if (!cardAttachedRef.current) {
        const payments = await window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach("#square-card-container");
        cardRef.current = card;
        cardAttachedRef.current = true;
      }

      setLoading(false);
    } catch (err) {
      console.error("prepare payment error:", err);
      setError("Something went wrong while preparing payment.");
      setLoading(false);
    }
  }

  async function completePayment() {
    if (!cardRef.current || !prepared) return;

    setLoading(true);
    setError("");

    try {
      const result = await cardRef.current.tokenize();

      if (result.status !== "OK" || !result.token) {
        setError(
          result.errors?.[0]?.message || "Unable to tokenize card details."
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/payments/square", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          invoiceId,
          sourceId: result.token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detailText = Array.isArray(data.details)
          ? data.details
              .map((d: any) => d.detail || d.code || "Payment failed")
              .join(", ")
          : "";
        setError(detailText || data.error || "Unable to process payment.");
        setLoading(false);
        return;
      }

      // Send confirmation emails only after successful payment
      try {
        const emailRes = await fetch("/api/payments/send-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: data.orderId,
            invoiceId: data.invoiceId,
            paymentReference: data.paymentReference,
          }),
        });

        const emailData = await emailRes.json();

        if (!emailRes.ok) {
          console.error("send-confirmation error:", emailData);
        } else {
          console.log("send-confirmation success:", emailData);
        }
      } catch (emailErr) {
        console.error("send-confirmation request failed:", emailErr);
      }

      router.push(
        `/checkout/success?orderId=${encodeURIComponent(
          data.orderId
        )}&invoiceId=${encodeURIComponent(
          data.invoiceId
        )}&orderToken=${encodeURIComponent(
          data.orderToken || ""
        )}&invoiceToken=${encodeURIComponent(
          data.invoiceToken || ""
        )}&orderNumber=${encodeURIComponent(
          data.orderNumber
        )}&invoiceNumber=${encodeURIComponent(data.invoiceNumber)}`
      );
    } catch (err) {
      console.error("complete payment error:", err);
      setError("Something went wrong while processing payment.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-[28px] border border-white/40 bg-white/25 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-4xl font-black text-slate-900">Payment</h1>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Enter your card details to complete your purchase securely.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl bg-white/60 p-5 text-sm font-semibold text-slate-800">
          <div className="flex justify-between">
            <span>Order Number</span>
            <span>{orderNumber || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span>Invoice Number</span>
            <span>{invoiceNumber || "-"}</span>
          </div>
          {prepared ? (
            <div className="flex justify-between">
              <span>Total Payable</span>
              <span>{moneyFromCents(prepared.amountCents)}</span>
            </div>
          ) : null}
        </div>

        {!prepared ? (
          <button
            onClick={preparePayment}
            disabled={loading || !sdkReady || !orderId || !invoiceId}
            className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Preparing..." : "Continue to Card Payment"}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <div
              id="square-card-container"
              className="rounded-2xl border border-white/50 bg-white/70 p-4"
            />

            <button
              onClick={completePayment}
              disabled={loading}
              className="w-full rounded-full bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : `Pay ${moneyFromCents(prepared.amountCents)}`}
            </button>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        <p className="mt-4 text-xs font-medium text-slate-600">
          Your card is processed using secure embedded payment fields.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading payment…</div>}>
      <PaymentInner />
    </Suspense>
  );
}