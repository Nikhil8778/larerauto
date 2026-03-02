import Link from "next/link";

const WHATSAPP_LINK =
  "https://wa.me/15482558778?text=" +
  encodeURIComponent("Hi LARE Automotive Supply, I have a question about parts/pricing.");

export default function AboutPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative p-7 md:p-10">
          <p className="text-xs font-extrabold tracking-widest text-white/70">
            LARE AUTOMOTIVE SUPPLY • SUDBURY • ONLINE + RETAIL • PREMIUM • BUDGET 
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            The right part. The right fitment. Competitive pricing.
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold text-white/75 md:text-base">
            We help retail customers, independent garages, and mechanics get quality auto parts without the confusion.
            Tell us the part + vehicle details (Year/Make/Model/VIN) and we’ll confirm fitment and pricing fast.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:opacity-90"
            >
              Get an Instant Quote
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold hover:bg-white/15"
            >
              WhatsApp Us
            </a>
            <a
              href="tel:+15482558778"
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold hover:bg-white/15"
            >
              Call
            </a>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Quality + Choice",
            desc: "Premium brands and budget-friendly options — we’ll recommend what makes sense for your vehicle and budget.",
          },
          {
            title: "Fitment First",
            desc: "We prioritize correct fitment. Provide VIN when possible for the fastest, most accurate match.",
          },
          {
            title: "Competitive Pricing",
            desc: "Clear pricing with quick turnaround. We aim to save you time and reduce unnecessary markups.",
          },
        ].map((x) => (
          <div key={x.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-black">{x.title}</div>
            <p className="mt-2 text-sm font-semibold text-white/75">{x.desc}</p>
          </div>
        ))}
      </section>

      {/* How we work */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <h2 className="text-2xl font-black">How it works</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { step: "1", title: "Tell us the part", desc: "Select a part from Catalog or Quote page." },
            { step: "2", title: "Provide vehicle details", desc: "Year / Make / Model (VIN recommended)." },
            { step: "3", title: "Get price + availability", desc: "We confirm fitment, pricing, pickup/delivery options." },
          ].map((s) => (
            <div key={s.step} className="rounded-3xl border border-white/10 bg-slate-950/30 p-5">
              <div className="text-xs font-extrabold tracking-widest text-white/60">STEP {s.step}</div>
              <div className="mt-1 text-lg font-black">{s.title}</div>
              <p className="mt-2 text-sm font-semibold text-white/75">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold hover:bg-white/15"
          >
            Browse Catalog
          </Link>
          <Link
            href="/quote"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 hover:opacity-90"
          >
            Instant Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
