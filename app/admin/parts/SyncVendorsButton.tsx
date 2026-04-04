"use client";

import { useState } from "react";

type Props = {
  selectedMake: string;
  selectedModel: string;
  selectedEngine: string;
  selectedYear: string;
  selectedPartType: string;
  selectedBatch: string;
  selectedSyncScope: string;
};

export default function SyncVendorsButton({
  selectedMake,
  selectedModel,
  selectedEngine,
  selectedYear,
  selectedPartType,
  selectedBatch,
  selectedSyncScope,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/sync-vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          make: selectedMake || undefined,
          model: selectedModel || undefined,
          engine: selectedEngine || undefined,
          year: selectedYear || undefined,
          partType: selectedPartType || undefined,
          batch: Number(selectedBatch || "10"),
          syncScope: selectedSyncScope || "pending",
        }),
      });

      if (!res.ok) {
        alert("Vendor sync failed.");
        return;
      }

      const data = await res.json();
      alert(
        `Amazon sync completed for ${data.count} offer(s).\n\nFilters:\nMake: ${
          selectedMake || "Any"
        }\nModel: ${selectedModel || "Any"}\nEngine: ${
          selectedEngine || "Any"
        }\nYear: ${selectedYear || "Any"}\nPart: ${
          selectedPartType || "Any"
        }\nBatch: ${selectedBatch}\nMode: ${
          selectedSyncScope === "all" ? "all filtered offers" : "pending/failed only"
        }`
      );
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
      {loading ? "Syncing..." : "Sync Amazon Prices"}
    </button>
  );
}