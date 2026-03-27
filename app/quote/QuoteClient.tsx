"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FALLBACK_PART_TYPES = [
  "Rotors & Brake Pads",
  "Calipers",
  "Bearings",
  "Brake Drum",
  "Alternators",
  "Starters",
  "Fuel Tanks",
  "Batteries",
  "Lights & Bulbs",
  "Fuses",
  "Control Arms",
  "Wheel Bearings",
  "Sway Bar Links",
  "Struts",
  "Shocks",
  "AC Compressor",
  "AC Condenser & Evaporator",
  "Tensioners & Pulleys",
  "Blower Motor",
  "Radiators",
  "Fuel Injectors",
  "Fuel Pumps",
  "Timing Belts",
  "Gaskets",
  "Spark Plugs",
] as const;

const PART_ALIASES: Record<string, string> = {
  Alternator: "Alternators",
  Alternators: "Alternators",
  Starter: "Starters",
  Starters: "Starters",
  Battery: "Batteries",
  Batteries: "Batteries",
  Bearing: "Bearings",
  Bearings: "Bearings",
  "Wheel Bearing": "Wheel Bearings",
  "Wheel Bearings": "Wheel Bearings",
  Caliper: "Calipers",
  Calipers: "Calipers",
  Rotor: "Rotors & Brake Pads",
  Rotors: "Rotors & Brake Pads",
  "Brake Pads": "Rotors & Brake Pads",
};

function normalizePartType(input: string | null): string {
  if (!input) return "Alternators";
  const trimmed = input.trim();
  return PART_ALIASES[trimmed] ?? trimmed;
}

function sanitizeVin(raw: string) {
  const up = raw.toUpperCase();
  const cleaned = up.replace(/[^A-Z0-9]/g, "").replace(/[IOQ]/g, "");
  return cleaned.slice(0, 17);
}

function formatVinDisplay(v: string) {
  const a = v.slice(0, 5);
  const b = v.slice(5, 10);
  const c = v.slice(10, 17);
  return [a, b, c].filter(Boolean).join(" ");
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Picker({
  open,
  title,
  items,
  selected,
  searchable = true,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  items: string[];
  selected?: string;
  searchable?: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((x) => x.toLowerCase().includes(qq));
  }, [q, items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/25"
        aria-label="Close picker"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-[min(420px,92vw)] border-l border-black/10 bg-white/80 shadow-2xl backdrop-blur-2xl">
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-lg font-black text-slate-900">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-black/5"
            >
              Close
            </button>
          </div>

          {searchable && (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="mt-4 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          )}

          <div className="mt-4 max-h-[78vh] overflow-auto rounded-2xl border border-black/10 bg-white/60">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm font-semibold text-slate-600">No results.</div>
            ) : (
              <ul className="divide-y divide-black/10">
                {filtered.map((x) => {
                  const isSel = x === selected;
                  return (
                    <li key={x}>
                      <button
                        type="button"
                        onClick={() => onSelect(x)}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold ${
                          isSel ? "bg-slate-900/5 text-slate-900" : "text-slate-800 hover:bg-black/5"
                        }`}
                      >
                        {x}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldButton({
  label,
  value,
  placeholder,
  onClick,
  disabled = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-700">{label}</div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? "text-slate-900" : "text-slate-500"}>{value || placeholder}</span>
        <span className="text-slate-500">
          <ChevronRight />
        </span>
      </button>
    </div>
  );
}

async function fetchFitmentOptions(
  kind: "years" | "makes" | "models" | "engines" | "partTypes",
  params?: Record<string, string>
) {
  const url = new URL("/api/fitment", window.location.origin);
  url.searchParams.set("kind", kind);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export default function QuoteClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engine, setEngine] = useState("");
  const [partType, setPartType] = useState("Alternators");
  const [vin, setVin] = useState("");

  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [makeOptions, setMakeOptions] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [engineOptions, setEngineOptions] = useState<string[]>([]);
  const [partTypeOptions, setPartTypeOptions] = useState<string[]>([]);

  const [picker, setPicker] = useState<null | "year" | "make" | "model" | "engine" | "part">(null);

  useEffect(() => {
    const incoming = sp.get("partType");
    setPartType(normalizePartType(incoming));
  }, [sp]);

  useEffect(() => {
    fetchFitmentOptions("years").then(setYearOptions);
  }, []);

  const vinIsValid = useMemo(() => {
    if (!vin.trim()) return true;
    return vin.length === 17;
  }, [vin]);

  const canSubmit = useMemo(() => {
    return Boolean(year && make && model && engine && partType && vinIsValid);
  }, [year, make, model, engine, partType, vinIsValid]);

  async function handleSelectYear(value: string) {
    setYear(value);
    setMake("");
    setModel("");
    setEngine("");
    setPartType(normalizePartType(sp.get("partType")));

    setMakeOptions([]);
    setModelOptions([]);
    setEngineOptions([]);
    setPartTypeOptions([]);

    const makes = await fetchFitmentOptions("makes", { year: value });
    setMakeOptions(makes);
    setPicker(null);
  }

  async function handleSelectMake(value: string) {
    setMake(value);
    setModel("");
    setEngine("");
    setPartType(normalizePartType(sp.get("partType")));

    setModelOptions([]);
    setEngineOptions([]);
    setPartTypeOptions([]);

    const models = await fetchFitmentOptions("models", {
      year,
      make: value,
    });
    setModelOptions(models);
    setPicker(null);
  }

  async function handleSelectModel(value: string) {
    setModel(value);
    setEngine("");
    setPartType(normalizePartType(sp.get("partType")));

    setEngineOptions([]);
    setPartTypeOptions([]);

    const engines = await fetchFitmentOptions("engines", {
      year,
      make,
      model: value,
    });
    setEngineOptions(engines);
    setPicker(null);
  }

  async function handleSelectEngine(value: string) {
    setEngine(value);

    const parts = await fetchFitmentOptions("partTypes", {
      year,
      make,
      model,
      engine: value,
    });

    setPartTypeOptions(parts);

    const requested = normalizePartType(sp.get("partType"));
    if (parts.includes(requested)) {
      setPartType(requested);
    } else if (parts.length > 0) {
      setPartType(parts[0]);
    } else {
      setPartType(requested);
    }

    setPicker(null);
  }

  function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!canSubmit) return;

  const utmSource = sp.get("utm_source") || "";
  const utmMedium = sp.get("utm_medium") || "";
  const utmCampaign = sp.get("utm_campaign") || "";
  const sourceChannel = utmSource || "";

  const params = new URLSearchParams({
    year,
    make,
    model,
    engine,
    partType,
    vin,
  });

  if (utmSource) params.set("utm_source", utmSource);
  if (utmMedium) params.set("utm_medium", utmMedium);
  if (utmCampaign) params.set("utm_campaign", utmCampaign);
  if (sourceChannel) params.set("source_channel", sourceChannel);

  router.push(`/quote/result?${params.toString()}`);
}

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-4xl font-black text-slate-900">Instant Quote</h1>
      <p className="mt-2 text-sm font-medium text-slate-700">
        Enter part + vehicle details to see pricing instantly. VIN improves fitment accuracy.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 rounded-[28px] border border-white/40 bg-white/25 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-xl font-extrabold text-slate-900">Instant Quote</div>

        <div className="mt-5 space-y-4">
          <FieldButton
            label="Year"
            value={year}
            placeholder="Select year..."
            onClick={() => setPicker("year")}
          />

          <FieldButton
            label="Make"
            value={make}
            placeholder={year ? "Select make..." : "Select year first"}
            onClick={() => {
              if (!year) return;
              setPicker("make");
            }}
            disabled={!year}
          />

          <FieldButton
            label="Model"
            value={model}
            placeholder={make ? "Select model..." : "Select make first"}
            onClick={() => {
              if (!make) return;
              setPicker("model");
            }}
            disabled={!make}
          />

          <FieldButton
            label="Engine"
            value={engine}
            placeholder={model ? "Select engine..." : "Select model first"}
            onClick={() => {
              if (!model) return;
              setPicker("engine");
            }}
            disabled={!model}
          />

          <FieldButton
            label="Part Type"
            value={partType}
            placeholder={engine ? "Select part type..." : "Select engine first"}
            onClick={() => {
              if (!engine) return;
              setPicker("part");
            }}
            disabled={!engine}
          />

          <div>
            <div className="text-sm font-bold text-slate-700">VIN (optional)</div>
            <input
              value={formatVinDisplay(vin)}
              onChange={(e) => setVin(sanitizeVin(e.target.value))}
              placeholder="17 characters — optional"
              className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20"
            />

            {!vinIsValid && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                VIN must be exactly 17 characters. I/O/Q are not allowed.
              </p>
            )}

            <p className="mt-2 text-xs font-medium text-slate-600">
              Inventory is now being read from your database structure.
            </p>
          </div>
        </div>

        <button
          disabled={!canSubmit}
          className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Get Instant Pricing
        </button>
      </form>

      <Picker
        open={picker === "year"}
        title="Year"
        items={yearOptions}
        selected={year}
        searchable
        onClose={() => setPicker(null)}
        onSelect={handleSelectYear}
      />

      <Picker
        open={picker === "make"}
        title="Make"
        items={makeOptions}
        selected={make}
        searchable
        onClose={() => setPicker(null)}
        onSelect={handleSelectMake}
      />

      <Picker
        open={picker === "model"}
        title="Model"
        items={modelOptions}
        selected={model}
        searchable
        onClose={() => setPicker(null)}
        onSelect={handleSelectModel}
      />

      <Picker
        open={picker === "engine"}
        title="Engine"
        items={engineOptions}
        selected={engine}
        searchable
        onClose={() => setPicker(null)}
        onSelect={handleSelectEngine}
      />

      <Picker
        open={picker === "part"}
        title="Part Type"
        items={partTypeOptions.length ? partTypeOptions : [...FALLBACK_PART_TYPES]}
        selected={partType}
        searchable
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setPartType(normalizePartType(v));
          setPicker(null);
        }}
      />
    </div>
  );
}