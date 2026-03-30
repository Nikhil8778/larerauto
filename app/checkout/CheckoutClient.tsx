"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCart, type CartItem } from "@/lib/cart";

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

type MechanicCheckoutProfileResponse = {
  success: boolean;
  profile?: {
    contactName: string;
    email: string;
    phone: string;
    companyName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  message?: string;
};

type MechanicPricePreviewResponse = {
  success: boolean;
  pricing?: {
    offerId: string;
    currency: string;
    originalPriceCents: number;
    discountPct: number;
    discountCents: number;
    discountedPriceCents: number;
  };
  message?: string;
};

type DraftCheckoutResponse = {
  success: boolean;
  draft?: {
    orderId: string;
    orderNumber: string;
    offerId: string;
    partType: string;
    quantity: number;
    itemPriceCents: number;
    subtotalCents: number;
    deliveryCents: number;
    taxCents: number;
    totalCents: number;
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    estimatedDeliveryText: string;
    mechanicDiscountCents: number;
  };
  message?: string;
};

type ReferralValidateResponse = {
  success: boolean;
  referral?: {
    id: string;
    mechanicId: string;
    code: string;
    mechanicShopName: string;
    customerDiscountPct: number;
    expiresAt: string | null;
  };
  message?: string;
};

type CheckoutLine = {
  offerId: string | null;
  partType: string;
  title: string;
  quantity: number;
  itemPrice: number;
  itemPriceCents: number;
  year?: string;
  make?: string;
  model?: string;
  engine?: string;
  vin?: string;
  imageUrl?: string;
};

export default function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const incomingOrderId = sp.get("orderId") || "";
  const quoteId = sp.get("quoteId") || "";
  const initialOfferId = sp.get("offerId") || "";
  const initialPartType = sp.get("partType") || "Item";
  const initialQty = Number(sp.get("qty") || 1);
  const mode = sp.get("mode") || "";
  const utmSource = sp.get("utm_source") || "";
  const utmMedium = sp.get("utm_medium") || "";
  const utmCampaign = sp.get("utm_campaign") || "";
  const sourceChannel = sp.get("source_channel") || utmSource || "website";

  const isMechanicResume = mode === "mechanic-resume";
  const isMechanicDirect = mode === "mechanic";
  const isCartMode = mode === "cart";
  const isMechanicCheckout = isMechanicDirect || isMechanicResume;
  const isCustomerCheckout = !isMechanicCheckout;

  const fallbackCustomerPrice = Number(sp.get("price") || 0);

  const [orderId, setOrderId] = useState(incomingOrderId);
  const [offerId, setOfferId] = useState(initialOfferId);
  const [partType, setPartType] = useState(initialPartType);
  const [qty, setQty] = useState(initialQty);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Ontario");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("Canada");

  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [appliedReferral, setAppliedReferral] =
    useState<ReferralValidateResponse["referral"] | null>(null);
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [referralMessage, setReferralMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [error, setError] = useState("");

  const [mechanicPriceData, setMechanicPriceData] =
    useState<MechanicPricePreviewResponse["pricing"] | null>(null);

  useEffect(() => {
    if (!isCartMode) return;
    const items = getCart();
    setCartItems(items);

    if (!items.length) {
      setError("Your cart is empty.");
    }
  }, [isCartMode]);

  useEffect(() => {
    let ignore = false;

    async function loadDraftCheckout() {
      if (!isMechanicResume || !incomingOrderId) return;

      setLoadingDraft(true);
      setError("");

      try {
        const res = await fetch(
          `/api/checkout/draft/${encodeURIComponent(incomingOrderId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: DraftCheckoutResponse = await res.json();

        if (!ignore && (!res.ok || !data.success || !data.draft)) {
          setError(data.message || "Unable to load draft checkout.");
          return;
        }

        if (!ignore && data.draft) {
          setOrderId(data.draft.orderId);
          setOfferId(data.draft.offerId);
          setPartType(data.draft.partType);
          setQty(data.draft.quantity);

          setFullName(data.draft.fullName || "");
          setEmail(data.draft.email || "");
          setPhone(data.draft.phone || "");
          setAddressLine1(data.draft.addressLine1 || "");
          setAddressLine2(data.draft.addressLine2 || "");
          setCity(data.draft.city || "");
          setProvince(data.draft.province || "Ontario");
          setPostal(data.draft.postalCode || "");
          setCountry(data.draft.country || "Canada");
        }
      } catch {
        if (!ignore) {
          setError("Unable to load draft checkout.");
        }
      } finally {
        if (!ignore) {
          setLoadingDraft(false);
        }
      }
    }

    loadDraftCheckout();

    return () => {
      ignore = true;
    };
  }, [incomingOrderId, isMechanicResume]);

  useEffect(() => {
    let ignore = false;

    async function loadMechanicProfile() {
      if (!isMechanicCheckout) return;

      setLoadingPrefill(true);

      try {
        const res = await fetch("/api/mechanic/checkout-profile", {
          method: "GET",
          cache: "no-store",
        });

        const data: MechanicCheckoutProfileResponse = await res.json();

        if (!ignore && res.ok && data.success && data.profile) {
          setFullName((prev) => prev || data.profile!.contactName || "");
          setEmail((prev) => prev || data.profile!.email || "");
          setPhone((prev) => prev || data.profile!.phone || "");
          setAddressLine1((prev) => prev || data.profile!.addressLine1 || "");
          setAddressLine2((prev) => prev || data.profile!.addressLine2 || "");
          setCity((prev) => prev || data.profile!.city || "");
          setProvince((prev) => prev || data.profile!.province || "Ontario");
          setPostal((prev) => prev || data.profile!.postalCode || "");
          setCountry((prev) => prev || data.profile!.country || "Canada");
        }
      } catch {
        // no-op
      } finally {
        if (!ignore) {
          setLoadingPrefill(false);
        }
      }
    }

    loadMechanicProfile();

    return () => {
      ignore = true;
    };
  }, [isMechanicCheckout]);

  useEffect(() => {
    let ignore = false;

    async function loadMechanicPrice() {
      if (!isMechanicCheckout || !offerId) return;

      setLoadingPrice(true);

      try {
        const res = await fetch("/api/mechanic/price-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ offerId }),
        });

        const data: MechanicPricePreviewResponse = await res.json();

        if (!ignore && res.ok && data.success && data.pricing) {
          setMechanicPriceData(data.pricing);
        } else if (!ignore) {
          setError(data.message || "Unable to load mechanic price preview.");
        }
      } catch {
        if (!ignore) {
          setError("Unable to load mechanic price preview.");
        }
      } finally {
        if (!ignore) {
          setLoadingPrice(false);
        }
      }
    }

    loadMechanicPrice();

    return () => {
      ignore = true;
    };
  }, [isMechanicCheckout, offerId]);

  useEffect(() => {
    if (isCartMode) return;
    if (!offerId || !partType) return;

    const hasMeaningfulContact =
      fullName.trim() && (email.trim() || phone.trim());

    if (!hasMeaningfulContact) return;

    const t = setTimeout(async () => {
      try {
        await fetch("/api/quote-leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteId: quoteId || null,
            offerId,
            fullName,
            email,
            phone,
            addressLine1,
            addressLine2,
            city,
            province,
            postalCode: postal,
            country,
            year: sp.get("year") || null,
            make: sp.get("make") || null,
            model: sp.get("model") || null,
            engine: sp.get("engine") || null,
            partType,
            vin: sp.get("vin") || null,
            itemPriceCents: Math.round(
              (isMechanicCheckout && mechanicPriceData
                ? mechanicPriceData.discountedPriceCents / 100
                : fallbackCustomerPrice) * 100
            ),
            utmSource,
            utmMedium,
            utmCampaign,
            sourceChannel,
            status: "contact_captured",
          }),
        });

        setLeadSaved(true);
      } catch {
        // silent
      }
    }, 900);

    return () => clearTimeout(t);
  }, [
    isCartMode,
    quoteId,
    offerId,
    partType,
    fullName,
    email,
    phone,
    addressLine1,
    addressLine2,
    city,
    province,
    postal,
    country,
    isMechanicCheckout,
    mechanicPriceData,
    fallbackCustomerPrice,
    utmSource,
    utmMedium,
    utmCampaign,
    sourceChannel,
    sp,
  ]);

  const checkoutLines: CheckoutLine[] = useMemo(() => {
    if (isCartMode) {
      return cartItems.map((item) => ({
        offerId: item.offerId,
        partType: item.partType,
        title: item.title,
        quantity: item.quantity,
        itemPrice: item.itemPrice,
        itemPriceCents: item.itemPriceCents,
        year: item.year,
        make: item.make,
        model: item.model,
        engine: item.engine,
        vin: item.vin,
        imageUrl: item.imageUrl,
      }));
    }

    return [
      {
        offerId: offerId || null,
        partType,
        title: partType,
        quantity: qty,
        itemPrice:
          isMechanicCheckout && mechanicPriceData
            ? mechanicPriceData.discountedPriceCents / 100
            : fallbackCustomerPrice,
        itemPriceCents:
          isMechanicCheckout && mechanicPriceData
            ? mechanicPriceData.discountedPriceCents
            : Math.round(fallbackCustomerPrice * 100),
        year: sp.get("year") || undefined,
        make: sp.get("make") || undefined,
        model: sp.get("model") || undefined,
        engine: sp.get("engine") || undefined,
        vin: sp.get("vin") || undefined,
      },
    ];
  }, [
    isCartMode,
    cartItems,
    offerId,
    partType,
    qty,
    isMechanicCheckout,
    mechanicPriceData,
    fallbackCustomerPrice,
    sp,
  ]);

  const regularUnitPrice = useMemo(() => {
    if (isMechanicCheckout && mechanicPriceData) {
      return mechanicPriceData.originalPriceCents / 100;
    }
    return fallbackCustomerPrice;
  }, [isMechanicCheckout, mechanicPriceData, fallbackCustomerPrice]);

  const mechanicUnitPrice = useMemo(() => {
    if (isMechanicCheckout && mechanicPriceData) {
      return mechanicPriceData.discountedPriceCents / 100;
    }
    return fallbackCustomerPrice;
  }, [isMechanicCheckout, mechanicPriceData, fallbackCustomerPrice]);

  const mechanicUnitDiscount = useMemo(() => {
    if (isMechanicCheckout && mechanicPriceData) {
      return mechanicPriceData.discountCents / 100;
    }
    return 0;
  }, [isMechanicCheckout, mechanicPriceData]);

  const customerReferralDiscountPct = appliedReferral?.customerDiscountPct || 0;

  const customerBaseSubtotal = useMemo(() => {
    if (isCartMode) {
      return checkoutLines.reduce(
        (sum, item) => sum + item.itemPrice * item.quantity,
        0
      );
    }
    return regularUnitPrice * qty;
  }, [isCartMode, checkoutLines, regularUnitPrice, qty]);

  const customerReferralDiscountAmount = useMemo(() => {
    if (!isCustomerCheckout || !appliedReferral) return 0;
    return customerBaseSubtotal * (customerReferralDiscountPct / 100);
  }, [isCustomerCheckout, appliedReferral, customerBaseSubtotal, customerReferralDiscountPct]);

  const itemPrice = useMemo(() => {
    if (isCartMode) return customerBaseSubtotal;
    if (isMechanicCheckout) {
      return mechanicUnitPrice;
    }
    return regularUnitPrice;
  }, [isCartMode, customerBaseSubtotal, isMechanicCheckout, mechanicUnitPrice, regularUnitPrice]);

  const subtotal = useMemo(() => {
    if (isCartMode) {
      return Math.max(0, customerBaseSubtotal - customerReferralDiscountAmount);
    }
    if (isMechanicCheckout) {
      return mechanicUnitPrice * qty;
    }
    return Math.max(0, customerBaseSubtotal - customerReferralDiscountAmount);
  }, [
    isCartMode,
    customerBaseSubtotal,
    customerReferralDiscountAmount,
    isMechanicCheckout,
    mechanicUnitPrice,
    qty,
  ]);

  const mechanicDiscount = useMemo(() => {
    if (!isMechanicCheckout) return 0;
    return mechanicUnitDiscount * qty;
  }, [isMechanicCheckout, mechanicUnitDiscount, qty]);

  const delivery = useMemo(() => {
    if (!postal.trim()) return 0;
    return deliveryFromPostal(postal);
  }, [postal]);

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
    subtotal > 0 &&
    (!isMechanicCheckout || !!mechanicPriceData) &&
    (!isCartMode || checkoutLines.length > 0);

  async function applyReferralCode() {
    if (!referralCodeInput.trim()) return;

    setApplyingReferral(true);
    setReferralMessage("");
    setError("");

    try {
      const res = await fetch("/api/referral/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: referralCodeInput.trim().toUpperCase(),
        }),
      });

      const data: ReferralValidateResponse = await res.json();

      if (!res.ok || !data.success || !data.referral) {
        setAppliedReferral(null);
        setReferralMessage(data.message || "Invalid referral code.");
        return;
      }

      setAppliedReferral(data.referral);
      setReferralCodeInput(data.referral.code);
      setReferralMessage(
        `Referral code applied. You saved ${data.referral.customerDiscountPct}% on item price only.`
      );
    } catch {
      setAppliedReferral(null);
      setReferralMessage("Unable to validate referral code.");
    } finally {
      setApplyingReferral(false);
    }
  }

  function removeReferralCode() {
    setAppliedReferral(null);
    setReferralCodeInput("");
    setReferralMessage("");
  }

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
          orderId: orderId || null,
          quoteId: quoteId || null,
          offerId: isCartMode ? null : offerId || null,
          partType: isCartMode ? "Cart Order" : partType,
          quantity: isCartMode ? null : qty,
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
          mode: isMechanicCheckout ? "mechanic" : "customer",
          regularItemPriceCents: Math.round(regularUnitPrice * 100),
          mechanicDiscountCents: Math.round(mechanicDiscount * 100),
          referralCode: appliedReferral?.code || null,
          referralCodeId: appliedReferral?.id || null,
          referredByMechanicId: appliedReferral?.mechanicId || null,
          referralDiscountCents: Math.round(customerReferralDiscountAmount * 100),
          utmSource,
          utmMedium,
          utmCampaign,
          sourceChannel,
          items: isCartMode
            ? checkoutLines.map((item) => ({
                offerId: item.offerId,
                partType: item.partType,
                title: item.title,
                quantity: item.quantity,
                itemPriceCents: item.itemPriceCents,
                year: item.year || null,
                make: item.make || null,
                model: item.model || null,
                engine: item.engine || null,
                vin: item.vin || null,
              }))
            : null,
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
      <h1 className="text-4xl font-black text-slate-900">
        {isMechanicCheckout ? "Mechanic Checkout" : "Checkout"}
      </h1>

      {isCartMode ? (
        <div className="mt-4 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900">
          You are checking out all items from your cart together.
        </div>
      ) : null}

      {isMechanicCheckout ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Mechanic pricing is applied to item subtotal only. Delivery and HST are added separately.
        </div>
      ) : null}

      {isMechanicResume ? (
        <div className="mt-4 rounded-2xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900">
          You are resuming a draft mechanic checkout.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <div className="text-xl font-extrabold text-slate-900">
            Delivery details
          </div>

          {loadingDraft ? (
            <div className="mt-4 text-sm font-medium text-slate-600">
              Loading draft checkout...
            </div>
          ) : null}

          {loadingPrefill ? (
            <div className="mt-4 text-sm font-medium text-slate-600">
              Loading saved mechanic details...
            </div>
          ) : null}

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

            {isCustomerCheckout ? (
              <div className="rounded-2xl border border-white/50 bg-white/60 p-4">
                <div className="text-sm font-bold text-slate-700">
                  Mechanic Referral Code
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    className="flex-1 rounded-2xl border border-white/50 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyReferralCode}
                    disabled={applyingReferral || !referralCodeInput.trim()}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {applyingReferral ? "Applying..." : "Apply"}
                  </button>
                </div>

                {appliedReferral ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                    <div>
                      Applied: <strong>{appliedReferral.code}</strong> from{" "}
                      <strong>{appliedReferral.mechanicShopName}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={removeReferralCode}
                      className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}

                {referralMessage ? (
                  <div className="mt-3 text-sm font-medium text-slate-700">
                    {referralMessage}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="text-xs font-medium text-slate-600">
              Delivery charge is calculated automatically from your postal code.
            </div>

            {leadSaved ? (
              <div className="text-xs font-medium text-emerald-700">
                Your details have been saved so we can help if checkout is interrupted.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl">
          <div className="text-xl font-extrabold text-slate-900">Order summary</div>

          {loadingPrice ? (
            <div className="mt-4 text-sm font-medium text-slate-600">
              Loading price...
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-800">
              {isCartMode ? (
                <>
                  {checkoutLines.map((item, idx) => (
                    <div
                      key={`${item.offerId || item.partType}-${idx}`}
                      className="rounded-2xl bg-white/50 p-3"
                    >
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {item.partType} • Qty {item.quantity}
                      </div>
                      <div className="mt-2 flex justify-between">
                        <span>Line total</span>
                        <span>{money(item.itemPrice * item.quantity)}</span>
                      </div>
                    </div>
                  ))}

                  {appliedReferral ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>Referral discount ({customerReferralDiscountPct}%)</span>
                      <span>- {money(customerReferralDiscountAmount)}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {isMechanicCheckout && mechanicPriceData ? (
                    <>
                      <div className="flex justify-between">
                        <span>Regular item price</span>
                        <span>{money(regularUnitPrice * qty)}</span>
                      </div>

                      <div className="flex justify-between text-emerald-700">
                        <span>Mechanic discount</span>
                        <span>- {money(mechanicDiscount)}</span>
                      </div>
                    </>
                  ) : null}

                  {isCustomerCheckout && appliedReferral ? (
                    <>
                      <div className="flex justify-between">
                        <span>Regular item price</span>
                        <span>{money(customerBaseSubtotal)}</span>
                      </div>

                      <div className="flex justify-between text-emerald-700">
                        <span>Referral discount ({customerReferralDiscountPct}%)</span>
                        <span>- {money(customerReferralDiscountAmount)}</span>
                      </div>
                    </>
                  ) : null}

                  <div className="flex justify-between">
                    <span>Item ({partType})</span>
                    <span>{money(subtotal)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <span>Subtotal</span>
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
          )}

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
            disabled={!canSubmit || submitting || loadingPrice || loadingDraft}
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