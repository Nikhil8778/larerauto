"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PART_TYPES = [
  "Alternators",
  "Starters",
  "Batteries",
  "Lights & Bulbs",
  "Fuses",
  "Brake Pads",
  "Rotors",
  "Calipers",
  "Bearings",
  "Wheel Bearings",
  "Brake Drum",
  "Control Arms",
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
  "Fuel Tanks",
  "Timing Belts",
  "Gaskets",
  "Spark Plugs",
] as const;

type PartType = (typeof PART_TYPES)[number];

// If your catalog uses slightly different labels, normalize here:
const PART_ALIASES: Record<string, PartType> = {
  "Wheel Bearing": "Wheel Bearings",
  "Wheel Bearings": "Wheel Bearings",
  Alternator: "Alternators",
  Alternators: "Alternators",
  Battery: "Batteries",
  Batteries: "Batteries",
  Starter: "Starters",
  Starters: "Starters",
  Bearing: "Bearings",
  Bearings: "Bearings",
  Caliper: "Calipers",
  Calipers: "Calipers",
};

// Simple demo makes/models. Replace later with real data.
const MAKES = [
  "Hyundai",
  "Toyota",
  "Honda",
  "Kia",
  "Nissan",
  "Mazda",
  "Ford",
  "Chevrolet",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
] as const;

const MODELS_BY_MAKE: Record<string, string[]> = {
  Hyundai: ["Tucson", "Elantra", "Santa Fe", "Sonata", "Kona"],
  Toyota: ["Corolla", "Camry", "RAV4", "Highlander", "Tacoma"],
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "Fit"],
  Kia: ["Soul", "Sportage", "Sorento", "Forte", "Seltos"],
  Nissan: ["Rogue", "Altima", "Sentra", "Pathfinder", "Murano"],
  Mazda: ["Mazda3", "Mazda6", "CX-5", "CX-30", "CX-9"],
  Ford: ["Escape", "Fusion", "F-150", "Focus", "Explorer"],
  Chevrolet: ["Cruze", "Malibu", "Equinox", "Silverado", "Trax"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "X1"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "A-Class"],
  Audi: ["A3", "A4", "A6", "Q5", "Q7"],
  Volkswagen: ["Jetta", "Passat", "Tiguan", "Golf", "Atlas"],
};

function normalizePartType(input: string | null): PartType {
  if (!input) return "Alternators";
  const trimmed = input.trim();
  const hit = PART_ALIASES[trimmed];
  if (hit) return hit;
  // if exact match
  if ((PART_TYPES as readonly string[]).includes(trimmed)) return trimmed as PartType;
  return "Alternators";
}

function makeYearList() {
  const now = new Date().getFullYear();
  const years: string[] = [];
  for (let y = now + 1; y >= now - 40; y--) years.push(String(y));
  return years;
}

function sanitizeVin(raw: string) {
  // VIN rules: uppercase A-Z (except I,O,Q) + digits, length 17
  const up = raw.toUpperCase();
  const cleaned = up.replace(/[^A-Z0-9]/g, "").replace(/[IOQ]/g, "");
  return cleaned.slice(0, 17);
}

function formatVinDisplay(v: string) {
  // Display grouping like XXXXX XXXXX XXXXXXX (optional)
  // Keep stored vin without spaces
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
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/25"
        aria-label="Close picker"
        onClick={onClose}
      />

      {/* slide-over */}
      <div className="absolute right-0 top-0 h-full w-[min(420px,92vw)] bg-white/80 backdrop-blur-2xl shadow-2xl border-l border-black/10">
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
                        className={`w-full text-left px-4 py-3 text-sm font-semibold ${
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
}: {
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-700">{label}</div>
      <button
        type="button"
        onClick={onClick}
        className="mt-2 w-full rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/20 flex items-center justify-between"
      >
        <span className={value ? "text-slate-900" : "text-slate-500"}>{value || placeholder}</span>
        <span className="text-slate-500">
          <ChevronRight />
        </span>
      </button>
    </div>
  );
}

export default function QuotePage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [partType, setPartType] = useState<PartType>("Alternators");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");

  const [picker, setPicker] = useState<null | "part" | "year" | "make" | "model">(null);

  // ✅ Pick up partType coming from catalog
  useEffect(() => {
    const incoming = sp.get("partType");
    const normalized = normalizePartType(incoming);
    setPartType(normalized);
  }, [sp]);

  // ✅ When make changes, reset model if not compatible
  useEffect(() => {
    if (!make) {
      setModel("");
      return;
    }
    const models = MODELS_BY_MAKE[make] || [];
    if (model && !models.includes(model)) setModel("");
  }, [make]); // eslint-disable-line react-hooks/exhaustive-deps

  const yearList = useMemo(() => makeYearList(), []);

  const modelList = useMemo(() => {
    if (!make) return [];
    return MODELS_BY_MAKE[make] || [];
  }, [make]);

  const vinIsValid = useMemo(() => {
    if (!vin.trim()) return true; // optional
    return vin.length === 17;
  }, [vin]);

  const canSubmit = useMemo(() => {
    return Boolean(partType && year.trim() && make.trim() && model.trim() && vinIsValid);
  }, [partType, year, make, model, vinIsValid]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const params = new URLSearchParams({
      partType,
      year,
      make,
      model,
      vin,
    });

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
        className="mt-8 rounded-[28px] border border-white/40 bg-white/25 backdrop-blur-xl shadow-2xl p-6"
      >
        <div className="text-xl font-extrabold text-slate-900">Instant Quote</div>

        <div className="mt-5 space-y-4">
          {/* ✅ Blue “>” style pickers */}
          <FieldButton
            label="Part Type"
            value={partType}
            placeholder="Select part type…"
            onClick={() => setPicker("part")}
          />

          <FieldButton
            label="Year"
            value={year}
            placeholder="e.g., 2017"
            onClick={() => setPicker("year")}
          />

          <FieldButton
            label="Make"
            value={make}
            placeholder="e.g., Hyundai"
            onClick={() => setPicker("make")}
          />

          <FieldButton
            label="Model"
            value={model}
            placeholder={make ? "Select model…" : "Select make first"}
            onClick={() => {
              if (!make) return;
              setPicker("model");
            }}
          />

          {/* VIN stays as input (with auto-format + validation) */}
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
                VIN must be exactly 17 characters (letters/numbers). I/O/Q are not allowed.
              </p>
            )}

            <p className="mt-2 text-xs font-medium text-slate-600">
              Inventory will be connected once distributor integration is enabled.
            </p>
          </div>
        </div>

        <button
          disabled={!canSubmit}
          className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          Get Instant Pricing
        </button>
      </form>

      {/* ✅ Right-side pickers */}
      <Picker
        open={picker === "part"}
        title="Part Type"
        items={[...PART_TYPES]}
        selected={partType}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setPartType(normalizePartType(v));
          setPicker(null);
        }}
      />

      <Picker
        open={picker === "year"}
        title="Year"
        items={yearList}
        selected={year}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setYear(v);
          setPicker(null);
        }}
      />

      <Picker
        open={picker === "make"}
        title="Make"
        items={[...MAKES]}
        selected={make}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setMake(v);
          setPicker(null);
        }}
      />

      <Picker
        open={picker === "model"}
        title="Model"
        items={modelList}
        selected={model}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setModel(v);
          setPicker(null);
        }}
      />
    </div>
  );
}