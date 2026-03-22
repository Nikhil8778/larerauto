"use client";

import { useEffect, useState } from "react";

type ReferralCode = {
  id: string;
  code: string;
  isActive: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  customerDiscountPct: number;
  createdAt: string;
};

export default function ReferralCodeManager() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCodes() {
    const res = await fetch("/api/mechanic/referral-codes");
    const data = await res.json();

    if (res.ok && data.success) {
      setCodes(data.codes || []);
    }
  }

  useEffect(() => {
    loadCodes();
  }, []);

  async function createCode() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/mechanic/referral-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usageLimit: 1,
          expiresDays: 7,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to create code.");
        return;
      }

      setMessage(`New referral code created: ${data.code.code}`);
      await loadCodes();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Referral Codes</h2>
          <p className="text-sm text-gray-600">
            Generate customer referral codes. Customer gets 2% off item price only.
          </p>
        </div>

        <button
          type="button"
          onClick={createCode}
          disabled={loading}
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          {loading ? "Creating..." : "Generate Code"}
        </button>
      </div>

      {message ? <p className="mb-4 text-sm">{message}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3 pr-4">Code</th>
              <th className="py-3 pr-4">Discount</th>
              <th className="py-3 pr-4">Used</th>
              <th className="py-3 pr-4">Usage Limit</th>
              <th className="py-3 pr-4">Expires</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id} className="border-b">
                <td className="py-3 pr-4 font-medium">{code.code}</td>
                <td className="py-3 pr-4">{code.customerDiscountPct}%</td>
                <td className="py-3 pr-4">{code.usedCount}</td>
                <td className="py-3 pr-4">{code.usageLimit ?? "Unlimited"}</td>
                <td className="py-3 pr-4">
                  {code.expiresAt
                    ? new Date(code.expiresAt).toLocaleDateString()
                    : "-"}
                </td>
                <td className="py-3 pr-4">
                  {code.isActive ? "Active" : "Inactive"}
                </td>
              </tr>
            ))}

            {!codes.length ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No referral codes generated yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}