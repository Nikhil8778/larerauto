export type QuoteInput = {
  partType: string;
  year: string;
  make: string;
  model: string;
  vin?: string;
};

// Demo base prices (before Logel’s integration).
// You can adjust these anytime.
export function getDemoBasePrice(partType: string): number {
  const key = partType.trim().toLowerCase();

  const map: Record<string, number> = {
    "alternator": 135,
    "starter": 145,
    "battery": 170,
    "brake pads": 65,
    "rotors": 85,
    "wheel bearing": 120,
    "control arm": 110,
    "oil filter": 12,
    "air filter": 18,
    "cabin filter": 22,
    "o2 sensor": 75,
    "maf sensor": 95,
    "abs sensor": 80,
  };

  return map[key] ?? 100; // default base price if not listed
}

export function calculateFinalPrice(basePrice: number) {
  const subtotal = basePrice * 2 + 40; // +100% and +$40
  const hst = subtotal * 0.13;
  const total = subtotal + hst;

  return {
    basePrice,
    subtotal,
    hst,
    total,
  };
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}
