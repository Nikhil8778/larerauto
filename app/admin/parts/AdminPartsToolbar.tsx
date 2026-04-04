"use client";

type Props = {
  makeOptions: string[];
  modelOptions: string[];
  engineOptions: string[];
  yearOptions: string[];
  partTypeOptions: string[];
  selectedMake: string;
  selectedModel: string;
  selectedEngine: string;
  selectedYear: string;
  selectedPartType: string;
  selectedStatus: string;
  selectedInventory: string;
  selectedBatch: string;
  selectedSyncScope: string;
};

export default function AdminPartsToolbar({
  makeOptions,
  modelOptions,
  engineOptions,
  yearOptions,
  partTypeOptions,
  selectedMake,
  selectedModel,
  selectedEngine,
  selectedYear,
  selectedPartType,
  selectedStatus,
  selectedInventory,
  selectedBatch,
  selectedSyncScope,
}: Props) {
  function updateUrl(mutator: (url: URL) => void) {
    const url = new URL(window.location.href);
    mutator(url);
    window.location.href = url.toString();
  }

  function handleMakeChange(value: string) {
    updateUrl((url) => {
      if (!value) url.searchParams.delete("make");
      else url.searchParams.set("make", value);

      url.searchParams.delete("model");
      url.searchParams.delete("engine");
      url.searchParams.delete("year");
      url.searchParams.delete("partType");
    });
  }

  function handleModelChange(value: string) {
    updateUrl((url) => {
      if (!value) url.searchParams.delete("model");
      else url.searchParams.set("model", value);

      url.searchParams.delete("engine");
      url.searchParams.delete("year");
      url.searchParams.delete("partType");
    });
  }

  function handleEngineChange(value: string) {
    updateUrl((url) => {
      if (!value) url.searchParams.delete("engine");
      else url.searchParams.set("engine", value);

      url.searchParams.delete("year");
      url.searchParams.delete("partType");
    });
  }

  function handleYearChange(value: string) {
    updateUrl((url) => {
      if (!value) url.searchParams.delete("year");
      else url.searchParams.set("year", value);

      url.searchParams.delete("partType");
    });
  }

  function updateQuery(key: string, value: string) {
    updateUrl((url) => {
      if (!value) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
  }

  const modelDisabled = !selectedMake;
  const engineDisabled = !selectedMake || !selectedModel;
  const yearDisabled = !selectedMake || !selectedModel || !selectedEngine;
  const partTypeDisabled =
    !selectedMake || !selectedModel || !selectedEngine || !selectedYear;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
            onClick={() => alert("Add Part form will be next step.")}
          >
            + Add Part
          </button>

          <button
            type="button"
            className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={() => alert("Bulk recalculate will be next step.")}
          >
            Recalculate Prices
          </button>

          <button
            type="button"
            className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
            onClick={() => alert("CSV export will be next step.")}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-9">
        <select
          value={selectedMake}
          onChange={(e) => handleMakeChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
        >
          <option value="">Select Make</option>
          {makeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={selectedModel}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={modelDisabled}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{modelDisabled ? "Select Make First" : "Select Model"}</option>
          {modelOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={selectedEngine}
          onChange={(e) => handleEngineChange(e.target.value)}
          disabled={engineDisabled}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{engineDisabled ? "Select Model First" : "Select Engine"}</option>
          {engineOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          disabled={yearDisabled}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{yearDisabled ? "Select Engine First" : "Select Year"}</option>
          {yearOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={selectedPartType}
          onChange={(e) => updateQuery("partType", e.target.value)}
          disabled={partTypeDisabled}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{partTypeDisabled ? "Select Year First" : "Select Part Type"}</option>
          {partTypeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => updateQuery("status", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={selectedInventory}
          onChange={(e) => updateQuery("inventory", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
        >
          <option value="">All Inventory</option>
          <option value="low">Low Inventory (&lt;= 2)</option>
          <option value="out">Out of Stock (= 0)</option>
        </select>

        <select
          value={selectedBatch}
          onChange={(e) => updateQuery("batch", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
        >
          <option value="1">Batch 1</option>
          <option value="3">Batch 3</option>
          <option value="5">Batch 5</option>
          <option value="10">Batch 10</option>
          <option value="25">Batch 25</option>
          <option value="50">Batch 50</option>
          <option value="100">Batch 100</option>
        </select>

        <select
          value={selectedSyncScope}
          onChange={(e) => updateQuery("syncScope", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
        >
          <option value="pending">Sync Pending/Failed</option>
          <option value="all">Sync All Filtered</option>
        </select>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
        Use small batches first to control ZenRows credits. Best practice is to sync
        only pending/failed offers for one exact make/model/engine/year/part type at a time.
      </div>
    </div>
  );
}