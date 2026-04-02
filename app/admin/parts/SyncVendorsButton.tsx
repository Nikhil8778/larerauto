"use client";

import { useState } from "react";

type Props = {
  selectedMake: string;
  selectedModel: string;
  selectedPartType: string;
  selectedBatch: string;
  selectedSyncScope: string;
};

export default function SyncVendorsButton({
  selectedMake,
  selectedModel,
  selectedPartType,
  selectedBatch,
  selectedSyncScope,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);

    try {
      const take = Number(selectedBatch || 10);
      const onlyPending = selectedSyncScope !== "all";

      const res = await fetch("/api/admin/sync-vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          make: selectedMake,
          model: selectedModel,
          partType: selectedPartType,
          take,
          onlyPending,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Vendor sync failed.");
        return;
      }

      alert(
        `Amazon sync completed for ${data.count} offer(s).\n\nFilters:\nMake: ${
          data.filters?.make || "all"
        }\nModel: ${data.filters?.model || "all"}\nPart: ${
          data.filters?.partType || "all"
        }\nBatch: ${data.filters?.take || take}\nMode: ${
          data.filters?.onlyPending ? "pending/failed only" : "all filtered offers"
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
      {loading ? "Syncing Amazon..." : "Sync Amazon Prices"}
    </button>
  );
}