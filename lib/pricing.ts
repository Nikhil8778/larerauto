export type QuoteInput = {
  partType: string;
  year: string;
  make: string;
  model: string;
  vin?: string;
};

// Demo base prices (before Logel’s integration).
export function getDemoBasePrice(partType: string): number {
  const key = partType.trim().toLowerCase();

  const map: Record<string, number> = {
    alternators: 205,
    starters: 189,
    batteries: 160,
    "brake pads": 79,
    rotors: 120,
    calipers: 130,
    bearings: 35,
    "brake drum": 95,
    "wheel bearings": 110,
    "control arms": 140,
    "lights & bulbs": 55,
    fuses: 18,
    "sway bar links": 65,
    struts: 160,
    shocks: 145,
    "ac compressor": 260,
    "ac condenser & evaporator": 220,
    "tensioners & pulleys": 95,
    "blower motor": 120,
    radiators: 210,
    "fuel injectors": 150,
    "fuel pumps": 180,
    "fuel tanks": 240,
    "timing belts": 85,
    gaskets: 45,
    "spark plugs": 30,
  };

  return map[key] ?? 100;
}

//
// ✅ ADD THIS NEW FUNCTION RIGHT HERE
//
export function calculateSellPriceFromCost(costCents: number) {
  const cost = costCents;

  const fixedFeeCents = 4000; // $40
  const subtotalCents = cost * 2 + fixedFeeCents;
  const hstCents = Math.round(subtotalCents * 0.13);
  const totalCents = subtotalCents + hstCents;

  return {
    costCents: cost,
    itemPriceCents: subtotalCents,
    hstCents,
    totalCents,
  };
}

export function calculateFinalPrice(basePrice: number) {
  const subtotal = basePrice * 2 + 40;
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
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n);
}