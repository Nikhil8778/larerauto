import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About Us | Lare Auto",
  description:
    "Learn about Lare Auto—your trusted source for quality auto parts, fast sourcing, and reliable customer support across Canada.",
};

const stats = [
  { label: "Parts sourced", value: "500+" },
  { label: "Happy customers", value: "100+" },
  { label: "Fast fulfillment", value: "Same/Next day" },
  { label: "Support", value: "Real humans" },
];

const values = [
  {
    title: "Quality first",
    desc: "We focus on reliable parts and trusted suppliers—no guessing, no compromise.",
  },
  {
    title: "Fast sourcing",
    desc: "We help you find the right part quickly with live availability and smart alternatives.",
  },
  {
    title: "Fair pricing",
    desc: "Transparent pricing with competitive rates for both DIY customers and repair shops.",
  },
  {
    title: "Customer support",
    desc: "We’re easy to reach, and we actually help—before and after you buy.",
  },
];

export default function AboutPage() {
  return (
    // NOTE: We do NOT set any background here, so your existing site background stays.
    <main className="w-full">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-black/80">
              LareAuto.ca • Auto Parts • Canada
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-black md:text-5xl">
              Keeping drivers moving, mechanics working, and vehicles performing at their best
            </h1>

            <p className="mt-4 text-base leading-relaxed text-black/95 md:text-lg">
              At <span className="font-semibold text-black">Lare Auto</span>, we
              make it easy to find quality parts with reliable availability and
              clear pricing—so you spend less time searching and more time getting back on the road.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="rounded-xl bg-white/40 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white hover:shadow-md"
              >
                Shop Parts
              </Link>
              <Link
                href="/quote"
                className="rounded-xl bg-white/40 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white hover:shadow-md"
              >
               Request a Quote
              </Link>
              <Link
                href="/contact"
                className="rounded-xl bg-white/40 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white hover:shadow-md"
              >
                Contact Us
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/15 bg-white/5 p-4"
                >
                  <div className="text-xl font-semibold text-black">{s.value}</div>
                  <div className="mt-1 text-xs text-black/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-sm">
              <Image
                src="/about/hero.jpeg"
                alt="Auto parts and tools"
                width={1200}
                height={800}
                className="h-[280px] w-full object-cover md:h-[460px]"
                priority
              />
            </div>
           
          </div>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-black">Our story</h2>
            <p className="mt-3 text-black/80 leading-relaxed">
              Lare Auto started with one goal: make auto parts buying simpler.
              Too many customers waste time calling around for stock, price, and
              fitment. We built LareAuto.ca to reduce that friction—so you can
              quickly find what you need, compare options, and order with confidence.
            </p>
            <p className="mt-3 text-black/80 leading-relaxed">
              Whether you’re a DIY customer, a professional mechanic, or a fleet
              buyer, our focus stays the same: dependable parts, fast sourcing,
              and helpful support.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5">
            <Image
              src="/about/warehouse.png"
              alt="Warehouse inventory"
              width={1200}
              height={800}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-black">What we stand for</h2>
              <p className="mt-2 text-black/75">
                The principles we use to serve every customer, every order.
              </p>
            </div>
            <Link
              href="/catalog"
             className="mt-3 inline-flex w-fit rounded-xl bg-white/40 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white hover:shadow md:mt-0"
            >
             Browse Categories
            </Link>
            
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-white/15 bg-black/20 p-5"
              >
                <div className="text-lg font-semibold text-black">{v.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-black/75">
                  {v.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO-COLUMN: TEAM + DELIVERY */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5">
            <Image
              src="/about/Team.png"
              alt="Customer support team"
              width={1200}
              height={800}
              className="h-[260px] w-full object-cover md:h-[360px]"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black">Real support</h3>
              <p className="mt-2 text-black/75 leading-relaxed">
                Questions about fitment, options, or availability? Our team helps
                you choose the right part with confidence.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5">
            <Image
              src="/about/delivery.png"
              alt="Auto parts delivery"
              width={1200}
              height={800}
              className="h-[260px] w-full object-cover md:h-[360px]"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black">Fast fulfillment</h3>
              <p className="mt-2 text-black/75 leading-relaxed">
                We prioritize speed and reliability—so your job doesn’t sit
                waiting for parts longer than it should.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-semibold text-black">
                Ready to find your part?
              </h3>
              <p className="mt-2 text-black/75">
                Browse parts, request a quote, or contact us for quick help.
              </p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <Link
                href="/catalog"
                className="rounded-xl bg-white/40 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white hover:shadow-md"
              >
                Go to Parts
              </Link>
              <Link
                href="/quote"
                className="rounded-xl bg-white/40 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white hover:shadow-md"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}