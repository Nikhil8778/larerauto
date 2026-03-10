"use client";

import { useState } from "react";

export default function SyncVendorsButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/sync-vendors", {
        method: "POST",
      });

      if (!res.ok) {
        alert("Vendor sync failed.");
        return;
      }

      const data = await res.json();
      alert(`Vendor sync completed for ${data.count} offer(s).`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Something went wrong during vendor sync.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={loading}
      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {loading ? "Syncing..." : "Sync All Prices"}
    </button>
  );
}