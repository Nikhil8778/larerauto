export type SeedVehicleMake = {
  make: string;
  models: {
    model: string;
    engines: {
      engine: string;
      years: number[];
    }[];
  }[];
};

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

// NOTE:
// This is a broad starter dataset for Canada / North America.
// It is intentionally structured for scalability in seed.ts.
// It is NOT a guaranteed complete VCdb/ACES-equivalent source of truth.
// For production-grade fitment, merge this with an authoritative catalog source.
export const vehicles: SeedVehicleMake[] = [
  {
    make: "Toyota",
    models: [
      { model: "Corolla", engines: [
        { engine: "1.8L I4", years: range(2009, 2022) },
        { engine: "2.0L I4", years: range(2019, 2026) },
        { engine: "1.8L Hybrid", years: range(2020, 2026) },
      ]},
      { model: "Camry", engines: [
        { engine: "2.5L I4", years: range(2012, 2026) },
        { engine: "3.5L V6", years: range(2012, 2024) },
        { engine: "2.5L Hybrid", years: range(2012, 2026) },
      ]},
      { model: "RAV4", engines: [
        { engine: "2.5L I4", years: range(2013, 2026) },
        { engine: "2.5L Hybrid", years: range(2016, 2026) },
        { engine: "2.5L Plug-in Hybrid", years: range(2021, 2026) },
      ]},
      { model: "Highlander", engines: [
        { engine: "3.5L V6", years: range(2014, 2022) },
        { engine: "2.4L Turbo", years: range(2023, 2026) },
        { engine: "2.5L Hybrid", years: range(2020, 2026) },
      ]},
      { model: "Tacoma", engines: [
        { engine: "2.7L I4", years: range(2016, 2023) },
        { engine: "3.5L V6", years: range(2016, 2023) },
        { engine: "2.4L Turbo", years: range(2024, 2026) },
      ]},
      { model: "Tundra", engines: [
        { engine: "4.6L V8", years: range(2009, 2021) },
        { engine: "5.7L V8", years: range(2009, 2021) },
        { engine: "3.4L Twin Turbo V6", years: range(2022, 2026) },
        { engine: "3.4L Hybrid Twin Turbo V6", years: range(2022, 2026) },
      ]},
      { model: "Prius", engines: [
        { engine: "1.8L Hybrid", years: range(2010, 2022) },
        { engine: "2.0L Hybrid", years: range(2023, 2026) },
      ]},
      { model: "4Runner", engines: [
        { engine: "4.0L V6", years: range(2010, 2024) },
        { engine: "2.4L Turbo Hybrid", years: range(2025, 2026) },
      ]},
      { model: "Venza", engines: [
        { engine: "2.7L I4", years: range(2009, 2015) },
        { engine: "3.5L V6", years: range(2009, 2015) },
        { engine: "2.5L Hybrid", years: range(2021, 2026) },
      ]},
      { model: "C-HR", engines: [
        { engine: "2.0L I4", years: range(2018, 2022) },
      ]},
      { model: "Sienna", engines: [
        { engine: "3.5L V6", years: range(2011, 2020) },
        { engine: "2.5L Hybrid", years: range(2021, 2026) },
      ]},
    ],
  },
  {
    make: "Honda",
    models: [
      { model: "Civic", engines: [
        { engine: "1.8L I4", years: range(2012, 2015) },
        { engine: "2.0L I4", years: range(2016, 2026) },
        { engine: "1.5L Turbo", years: range(2016, 2026) },
        { engine: "2.0L Hybrid", years: range(2025, 2026) },
      ]},
      { model: "Accord", engines: [
        { engine: "2.4L I4", years: range(2013, 2017) },
        { engine: "3.5L V6", years: range(2013, 2017) },
        { engine: "1.5L Turbo", years: range(2018, 2026) },
        { engine: "2.0L Turbo", years: range(2018, 2022) },
        { engine: "2.0L Hybrid", years: range(2018, 2026) },
      ]},
      { model: "CR-V", engines: [
        { engine: "2.4L I4", years: range(2012, 2019) },
        { engine: "1.5L Turbo", years: range(2017, 2026) },
        { engine: "2.0L Hybrid", years: range(2020, 2026) },
      ]},
      { model: "HR-V", engines: [
        { engine: "1.8L I4", years: range(2016, 2022) },
        { engine: "2.0L I4", years: range(2023, 2026) },
      ]},
      { model: "Pilot", engines: [
        { engine: "3.5L V6", years: range(2009, 2026) },
      ]},
      { model: "Odyssey", engines: [
        { engine: "3.5L V6", years: range(2008, 2026) },
      ]},
      { model: "Ridgeline", engines: [
        { engine: "3.5L V6", years: range(2009, 2014) },
        { engine: "3.5L V6", years: range(2017, 2026) },
      ]},
      { model: "Fit", engines: [
        { engine: "1.5L I4", years: range(2009, 2020) },
      ]},
    ],
  },
  {
    make: "Hyundai",
    models: [
      { model: "Elantra", engines: [
        { engine: "1.8L I4", years: range(2011, 2016) },
        { engine: "2.0L I4", years: range(2017, 2026) },
        { engine: "1.6L Turbo", years: range(2017, 2024) },
      ]},
      { model: "Sonata", engines: [
        { engine: "2.4L I4", years: range(2011, 2019) },
        { engine: "2.0L Turbo", years: range(2011, 2020) },
        { engine: "1.6L Turbo", years: range(2018, 2021) },
        { engine: "2.5L I4", years: range(2020, 2026) },
        { engine: "1.6L Hybrid", years: range(2020, 2026) },
      ]},
      { model: "Tucson", engines: [
        { engine: "2.0L I4", years: range(2016, 2021) },
        { engine: "2.4L I4", years: range(2016, 2021) },
        { engine: "1.6L Turbo", years: range(2016, 2021) },
        { engine: "2.5L I4", years: range(2022, 2026) },
        { engine: "1.6L Hybrid", years: range(2022, 2026) },
      ]},
      { model: "Santa Fe", engines: [
        { engine: "2.4L I4", years: range(2013, 2020) },
        { engine: "2.0L Turbo", years: range(2013, 2023) },
        { engine: "2.5L I4", years: range(2021, 2026) },
        { engine: "2.5L Turbo", years: range(2021, 2026) },
        { engine: "1.6L Hybrid", years: range(2021, 2026) },
      ]},
      { model: "Kona", engines: [
        { engine: "2.0L I4", years: range(2018, 2026) },
        { engine: "1.6L Turbo", years: range(2018, 2026) },
      ]},
      { model: "Accent", engines: [
        { engine: "1.6L I4", years: range(2012, 2022) },
      ]},
      { model: "Venue", engines: [
        { engine: "1.6L I4", years: range(2020, 2026) },
      ]},
      { model: "Palisade", engines: [
        { engine: "3.8L V6", years: range(2020, 2026) },
      ]},
    ],
  },
  {
    make: "Kia",
    models: [
      { model: "Forte", engines: [
        { engine: "2.0L I4", years: range(2014, 2026) },
        { engine: "1.6L Turbo", years: range(2014, 2024) },
      ]},
      { model: "K5", engines: [
        { engine: "1.6L Turbo", years: range(2021, 2026) },
        { engine: "2.5L Turbo", years: range(2021, 2026) },
      ]},
      { model: "Optima", engines: [
        { engine: "2.4L I4", years: range(2011, 2020) },
        { engine: "1.6L Turbo", years: range(2016, 2020) },
        { engine: "2.0L Turbo", years: range(2011, 2020) },
      ]},
      { model: "Sportage", engines: [
        { engine: "2.4L I4", years: range(2011, 2023) },
        { engine: "2.0L Turbo", years: range(2017, 2023) },
        { engine: "2.5L I4", years: range(2023, 2026) },
        { engine: "1.6L Turbo Hybrid", years: range(2023, 2026) },
      ]},
      { model: "Sorento", engines: [
        { engine: "2.4L I4", years: range(2011, 2020) },
        { engine: "3.3L V6", years: range(2014, 2020) },
        { engine: "2.5L I4", years: range(2021, 2026) },
        { engine: "2.5L Turbo", years: range(2021, 2026) },
        { engine: "1.6L Hybrid", years: range(2021, 2026) },
      ]},
      { model: "Telluride", engines: [
        { engine: "3.8L V6", years: range(2020, 2026) },
      ]},
    ],
  },
  {
    make: "Ford",
    models: [
      { model: "Escape", engines: [
        { engine: "2.5L I4", years: range(2013, 2019) },
        { engine: "1.5L EcoBoost", years: range(2017, 2026) },
        { engine: "2.0L EcoBoost", years: range(2013, 2026) },
        { engine: "2.5L Hybrid", years: range(2020, 2026) },
        { engine: "2.5L Plug-in Hybrid", years: range(2020, 2026) },
      ]},
      { model: "Edge", engines: [
        { engine: "2.0L EcoBoost", years: range(2011, 2024) },
        { engine: "2.7L EcoBoost", years: range(2015, 2024) },
        { engine: "3.5L V6", years: range(2011, 2018) },
      ]},
      { model: "Explorer", engines: [
        { engine: "2.3L EcoBoost", years: range(2016, 2026) },
        { engine: "3.5L V6", years: range(2011, 2019) },
        { engine: "3.0L Twin Turbo V6", years: range(2020, 2026) },
      ]},
      { model: "F-150", engines: [
        { engine: "3.3L V6", years: range(2018, 2024) },
        { engine: "2.7L EcoBoost", years: range(2015, 2026) },
        { engine: "3.5L EcoBoost", years: range(2011, 2026) },
        { engine: "5.0L V8", years: range(2011, 2026) },
        { engine: "3.5L PowerBoost Hybrid", years: range(2021, 2026) },
      ]},
      { model: "Ranger", engines: [
        { engine: "2.3L EcoBoost", years: range(2019, 2026) },
        { engine: "2.7L EcoBoost", years: range(2024, 2026) },
      ]},
      { model: "Mustang", engines: [
        { engine: "2.3L EcoBoost", years: range(2015, 2026) },
        { engine: "5.0L V8", years: range(2011, 2026) },
      ]},
      { model: "Bronco Sport", engines: [
        { engine: "1.5L EcoBoost", years: range(2021, 2026) },
        { engine: "2.0L EcoBoost", years: range(2021, 2026) },
      ]},
    ],
  },
  {
    make: "Chevrolet",
    models: [
      { model: "Cruze", engines: [
        { engine: "1.4L Turbo", years: range(2011, 2019) },
        { engine: "1.8L I4", years: range(2011, 2016) },
      ]},
      { model: "Malibu", engines: [
        { engine: "1.5L Turbo", years: range(2016, 2026) },
        { engine: "2.0L Turbo", years: range(2013, 2024) },
      ]},
      { model: "Equinox", engines: [
        { engine: "2.4L I4", years: range(2010, 2017) },
        { engine: "1.5L Turbo", years: range(2018, 2026) },
        { engine: "2.0L Turbo", years: range(2018, 2024) },
      ]},
      { model: "Traverse", engines: [
        { engine: "3.6L V6", years: range(2009, 2026) },
      ]},
      { model: "Silverado 1500", engines: [
        { engine: "4.3L V6", years: range(2014, 2021) },
        { engine: "5.3L V8", years: range(2009, 2026) },
        { engine: "6.2L V8", years: range(2014, 2026) },
        { engine: "2.7L Turbo", years: range(2019, 2026) },
      ]},
      { model: "Tahoe", engines: [
        { engine: "5.3L V8", years: range(2009, 2026) },
        { engine: "6.2L V8", years: range(2015, 2026) },
      ]},
      { model: "Suburban", engines: [
        { engine: "5.3L V8", years: range(2009, 2026) },
        { engine: "6.2L V8", years: range(2015, 2026) },
      ]},
      { model: "Colorado", engines: [
        { engine: "2.5L I4", years: range(2015, 2022) },
        { engine: "3.6L V6", years: range(2015, 2022) },
        { engine: "2.7L Turbo", years: range(2023, 2026) },
      ]},
    ],
  },
  {
    make: "Nissan",
    models: [
      { model: "Sentra", engines: [
        { engine: "1.8L I4", years: range(2013, 2019) },
        { engine: "2.0L I4", years: range(2020, 2026) },
      ]},
      { model: "Altima", engines: [
        { engine: "2.5L I4", years: range(2013, 2026) },
        { engine: "3.5L V6", years: range(2013, 2018) },
        { engine: "2.0L VC-Turbo", years: range(2019, 2024) },
      ]},
      { model: "Rogue", engines: [
        { engine: "2.5L I4", years: range(2014, 2026) },
        { engine: "1.5L Turbo", years: range(2022, 2026) },
      ]},
      { model: "Murano", engines: [
        { engine: "3.5L V6", years: range(2009, 2026) },
      ]},
      { model: "Pathfinder", engines: [
        { engine: "3.5L V6", years: range(2013, 2026) },
      ]},
      { model: "Frontier", engines: [
        { engine: "4.0L V6", years: range(2009, 2019) },
        { engine: "3.8L V6", years: range(2020, 2026) },
      ]},
      { model: "Kicks", engines: [
        { engine: "1.6L I4", years: range(2018, 2026) },
      ]},
    ],
  },
  {
    make: "Mazda",
    models: [
      { model: "Mazda3", engines: [
        { engine: "2.0L I4", years: range(2010, 2026) },
        { engine: "2.5L I4", years: range(2014, 2026) },
        { engine: "2.5L Turbo", years: range(2021, 2026) },
      ]},
      { model: "Mazda6", engines: [
        { engine: "2.5L I4", years: range(2014, 2021) },
        { engine: "2.5L Turbo", years: range(2018, 2021) },
      ]},
      { model: "CX-3", engines: [
        { engine: "2.0L I4", years: range(2016, 2021) },
      ]},
      { model: "CX-30", engines: [
        { engine: "2.5L I4", years: range(2020, 2026) },
        { engine: "2.5L Turbo", years: range(2021, 2026) },
      ]},
      { model: "CX-5", engines: [
        { engine: "2.5L I4", years: range(2013, 2026) },
        { engine: "2.5L Turbo", years: range(2019, 2026) },
      ]},
      { model: "CX-9", engines: [
        { engine: "3.7L V6", years: range(2009, 2015) },
        { engine: "2.5L Turbo", years: range(2016, 2023) },
      ]},
      { model: "CX-50", engines: [
        { engine: "2.5L I4", years: range(2023, 2026) },
        { engine: "2.5L Turbo", years: range(2023, 2026) },
      ]},
    ],
  },
  {
    make: "Subaru",
    models: [
      { model: "Impreza", engines: [
        { engine: "2.0L H4", years: range(2012, 2024) },
        { engine: "2.5L H4", years: range(2024, 2026) },
      ]},
      { model: "Legacy", engines: [
        { engine: "2.5L H4", years: range(2010, 2026) },
        { engine: "2.4L Turbo", years: range(2020, 2026) },
        { engine: "3.6L H6", years: range(2010, 2019) },
      ]},
      { model: "Outback", engines: [
        { engine: "2.5L H4", years: range(2010, 2026) },
        { engine: "2.4L Turbo", years: range(2020, 2026) },
        { engine: "3.6L H6", years: range(2010, 2019) },
      ]},
      { model: "Forester", engines: [
        { engine: "2.5L H4", years: range(2011, 2026) },
        { engine: "2.0L Turbo", years: range(2014, 2018) },
      ]},
      { model: "Crosstrek", engines: [
        { engine: "2.0L H4", years: range(2013, 2026) },
        { engine: "2.5L H4", years: range(2021, 2026) },
      ]},
      { model: "Ascent", engines: [
        { engine: "2.4L Turbo", years: range(2019, 2026) },
      ]},
    ],
  },
  {
    make: "Volkswagen",
    models: [
      { model: "Jetta", engines: [
        { engine: "2.0L I4", years: range(2011, 2015) },
        { engine: "1.4L Turbo", years: range(2019, 2024) },
        { engine: "1.5L Turbo", years: range(2025, 2026) },
        { engine: "1.8L Turbo", years: range(2014, 2018) },
        { engine: "2.0L Turbo", years: range(2019, 2026) },
      ]},
      { model: "Passat", engines: [
        { engine: "1.8L Turbo", years: range(2014, 2019) },
        { engine: "2.0L Turbo", years: range(2020, 2022) },
        { engine: "3.6L V6", years: range(2012, 2018) },
      ]},
      { model: "Tiguan", engines: [
        { engine: "2.0L Turbo", years: range(2010, 2026) },
      ]},
      { model: "Atlas", engines: [
        { engine: "2.0L Turbo", years: range(2018, 2026) },
        { engine: "3.6L V6", years: range(2018, 2025) },
      ]},
      { model: "Taos", engines: [
        { engine: "1.5L Turbo", years: range(2022, 2026) },
      ]},
      { model: "Golf", engines: [
        { engine: "1.8L Turbo", years: range(2015, 2021) },
        { engine: "1.4L Turbo", years: range(2018, 2021) },
        { engine: "2.0L Turbo", years: range(2010, 2026) },
      ]},
    ],
  },
  {
    make: "Audi",
    models: [
      { model: "A3", engines: [{ engine: "2.0L Turbo", years: range(2015, 2026) }] },
      { model: "A4", engines: [{ engine: "2.0L Turbo", years: range(2013, 2026) }] },
      { model: "A5", engines: [{ engine: "2.0L Turbo", years: range(2013, 2026) }] },
      { model: "A6", engines: [
        { engine: "2.0L Turbo", years: range(2012, 2026) },
        { engine: "3.0L V6", years: range(2012, 2024) },
      ]},
      { model: "Q3", engines: [{ engine: "2.0L Turbo", years: range(2015, 2026) }] },
      { model: "Q5", engines: [{ engine: "2.0L Turbo", years: range(2013, 2026) }] },
      { model: "Q7", engines: [{ engine: "3.0L V6", years: range(2011, 2026) }] },
    ],
  },
  {
    make: "BMW",
    models: [
      { model: "3 Series", engines: [
        { engine: "2.0L Turbo", years: range(2012, 2026) },
        { engine: "3.0L Turbo", years: range(2012, 2026) },
      ]},
      { model: "5 Series", engines: [
        { engine: "2.0L Turbo", years: range(2012, 2026) },
        { engine: "3.0L Turbo", years: range(2012, 2026) },
      ]},
      { model: "X1", engines: [{ engine: "2.0L Turbo", years: range(2013, 2026) }] },
      { model: "X3", engines: [
        { engine: "2.0L Turbo", years: range(2011, 2026) },
        { engine: "3.0L Turbo", years: range(2011, 2026) },
      ]},
      { model: "X5", engines: [
        { engine: "3.0L Turbo", years: range(2011, 2026) },
        { engine: "4.4L Twin Turbo V8", years: range(2011, 2026) },
      ]},
    ],
  },
  {
    make: "Mercedes-Benz",
    models: [
      { model: "C-Class", engines: [
        { engine: "2.0L Turbo", years: range(2015, 2026) },
        { engine: "3.0L Twin Turbo V6", years: range(2015, 2023) },
      ]},
      { model: "E-Class", engines: [
        { engine: "2.0L Turbo", years: range(2014, 2026) },
        { engine: "3.0L V6", years: range(2014, 2020) },
      ]},
      { model: "GLA", engines: [{ engine: "2.0L Turbo", years: range(2015, 2026) }] },
      { model: "GLC", engines: [{ engine: "2.0L Turbo", years: range(2016, 2026) }] },
      { model: "GLE", engines: [
        { engine: "2.0L Turbo", years: range(2020, 2026) },
        { engine: "3.0L Turbo", years: range(2016, 2026) },
      ]},
    ],
  },
  {
    make: "Acura",
    models: [
      { model: "ILX", engines: [{ engine: "2.4L I4", years: range(2013, 2022) }] },
      { model: "Integra", engines: [{ engine: "1.5L Turbo", years: range(2023, 2026) }] },
      { model: "TLX", engines: [
        { engine: "2.4L I4", years: range(2015, 2020) },
        { engine: "2.0L Turbo", years: range(2021, 2026) },
        { engine: "3.5L V6", years: range(2015, 2020) },
        { engine: "3.0L Turbo", years: range(2021, 2026) },
      ]},
      { model: "RDX", engines: [
        { engine: "3.5L V6", years: range(2013, 2018) },
        { engine: "2.0L Turbo", years: range(2019, 2026) },
      ]},
      { model: "MDX", engines: [
        { engine: "3.5L V6", years: range(2010, 2026) },
        { engine: "3.0L Turbo", years: range(2022, 2026) },
      ]},
    ],
  },
  {
    make: "Lexus",
    models: [
      { model: "IS", engines: [
        { engine: "2.0L Turbo", years: range(2016, 2025) },
        { engine: "3.5L V6", years: range(2014, 2026) },
      ]},
      { model: "ES", engines: [
        { engine: "2.5L I4", years: range(2019, 2026) },
        { engine: "3.5L V6", years: range(2013, 2026) },
        { engine: "2.5L Hybrid", years: range(2019, 2026) },
      ]},
      { model: "NX", engines: [
        { engine: "2.0L Turbo", years: range(2015, 2021) },
        { engine: "2.5L I4", years: range(2022, 2026) },
        { engine: "2.5L Hybrid", years: range(2022, 2026) },
      ]},
      { model: "RX", engines: [
        { engine: "3.5L V6", years: range(2010, 2022) },
        { engine: "2.4L Turbo", years: range(2023, 2026) },
        { engine: "2.5L Hybrid", years: range(2023, 2026) },
      ]},
      { model: "GX", engines: [{ engine: "4.6L V8", years: range(2010, 2026) }] },
    ],
  },
  {
    make: "Jeep",
    models: [
      { model: "Compass", engines: [
        { engine: "2.4L I4", years: range(2011, 2026) },
        { engine: "2.0L Turbo", years: range(2023, 2026) },
      ]},
      { model: "Cherokee", engines: [
        { engine: "2.4L I4", years: range(2014, 2023) },
        { engine: "3.2L V6", years: range(2014, 2023) },
        { engine: "2.0L Turbo", years: range(2019, 2023) },
      ]},
      { model: "Grand Cherokee", engines: [
        { engine: "3.6L V6", years: range(2011, 2026) },
        { engine: "5.7L V8", years: range(2011, 2026) },
        { engine: "2.0L Plug-in Hybrid", years: range(2022, 2026) },
      ]},
      { model: "Wrangler", engines: [
        { engine: "3.6L V6", years: range(2012, 2026) },
        { engine: "2.0L Turbo", years: range(2018, 2026) },
        { engine: "3.6L Plug-in Hybrid", years: range(2021, 2026) },
      ]},
      { model: "Gladiator", engines: [
        { engine: "3.6L V6", years: range(2020, 2026) },
      ]},
    ],
  },
  {
    make: "Dodge",
    models: [
      { model: "Charger", engines: [
        { engine: "3.6L V6", years: range(2011, 2026) },
        { engine: "5.7L V8", years: range(2011, 2023) },
        { engine: "6.4L V8", years: range(2012, 2023) },
      ]},
      { model: "Challenger", engines: [
        { engine: "3.6L V6", years: range(2011, 2023) },
        { engine: "5.7L V8", years: range(2011, 2023) },
        { engine: "6.4L V8", years: range(2011, 2023) },
      ]},
      { model: "Durango", engines: [
        { engine: "3.6L V6", years: range(2011, 2026) },
        { engine: "5.7L V8", years: range(2011, 2026) },
        { engine: "6.4L V8", years: range(2018, 2025) },
      ]},
      { model: "Hornet", engines: [
        { engine: "2.0L Turbo", years: range(2023, 2026) },
        { engine: "1.3L Plug-in Hybrid", years: range(2024, 2026) },
      ]},
    ],
  },
  {
    make: "Ram",
    models: [
      { model: "1500", engines: [
        { engine: "3.6L V6", years: range(2013, 2026) },
        { engine: "5.7L V8", years: range(2013, 2026) },
        { engine: "3.0L I6 Twin Turbo", years: range(2025, 2026) },
      ]},
      { model: "2500", engines: [
        { engine: "6.4L V8", years: range(2014, 2026) },
      ]},
      { model: "3500", engines: [
        { engine: "6.4L V8", years: range(2014, 2026) },
      ]},
      { model: "ProMaster", engines: [
        { engine: "3.6L V6", years: range(2014, 2026) },
      ]},
    ],
  },
  {
    make: "GMC",
    models: [
      { model: "Terrain", engines: [
        { engine: "2.4L I4", years: range(2010, 2017) },
        { engine: "1.5L Turbo", years: range(2018, 2026) },
        { engine: "2.0L Turbo", years: range(2018, 2024) },
      ]},
      { model: "Acadia", engines: [
        { engine: "2.5L I4", years: range(2017, 2019) },
        { engine: "2.0L Turbo", years: range(2020, 2026) },
        { engine: "3.6L V6", years: range(2010, 2026) },
      ]},
      { model: "Sierra 1500", engines: [
        { engine: "5.3L V8", years: range(2009, 2026) },
        { engine: "6.2L V8", years: range(2014, 2026) },
        { engine: "2.7L Turbo", years: range(2019, 2026) },
      ]},
      { model: "Yukon", engines: [
        { engine: "5.3L V8", years: range(2009, 2026) },
        { engine: "6.2L V8", years: range(2015, 2026) },
      ]},
    ],
  },
  {
    make: "Volvo",
    models: [
      { model: "S60", engines: [{ engine: "2.0L Turbo", years: range(2012, 2026) }] },
      { model: "S90", engines: [{ engine: "2.0L Turbo", years: range(2017, 2026) }] },
      { model: "XC40", engines: [{ engine: "2.0L Turbo", years: range(2019, 2026) }] },
      { model: "XC60", engines: [{ engine: "2.0L Turbo", years: range(2010, 2026) }] },
      { model: "XC90", engines: [{ engine: "2.0L Turbo", years: range(2016, 2026) }] },
    ],
  },
  {
    make: "Mitsubishi",
    models: [
      { model: "Lancer", engines: [
        { engine: "2.0L I4", years: range(2009, 2017) },
        { engine: "2.4L I4", years: range(2009, 2017) },
      ]},
      { model: "RVR", engines: [{ engine: "2.0L I4", years: range(2011, 2026) }] },
      { model: "Outlander", engines: [
        { engine: "2.4L I4", years: range(2011, 2026) },
        { engine: "3.0L V6", years: range(2011, 2020) },
        { engine: "2.5L I4", years: range(2022, 2026) },
        { engine: "2.4L Plug-in Hybrid", years: range(2018, 2026) },
      ]},
      { model: "Eclipse Cross", engines: [{ engine: "1.5L Turbo", years: range(2018, 2026) }] },
    ],
  },
];
