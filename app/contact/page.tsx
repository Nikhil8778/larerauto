"use client";

import Link from "next/link";



const WHATSAPP_NUMBER = "15482558778";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi Lare Auto, I need help with an auto part. My VIN is: "
)}`;
const PHONE_LINK = "tel:+1-548-255-8778";
const SUPPORT_EMAIL = "support@lareauto.ca";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black md:text-6xl">
          Get in Touch with Us
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">
          Need help finding the right part? Send your VIN and details and we&apos;ll get
          back to you with the right part for your vehicle.
        </p>
      </header>

      {/* Content grid */}
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-2 rounded-3xl border border-white/12 bg-black/25 p-6 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-black/80">
              📞 Quick help:{" "}
              <a className="text-white hover:underline" href={PHONE_LINK}>
                (548) 255-8778
              </a>
            </div>

            <Link
              href="/quote"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-black hover:bg-white/10 transition"
            >
              Get Instant Quote →
            </Link>
          </div>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Form submitted (demo). Connect it to email/API when ready.");
            }}
          >
            <Input label="Full Name" name="name" placeholder="Your full name" />
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@email.com"
            />
            <Input label="Phone Number" name="phone" placeholder="(###) ###-####" />
            <Input
              label="Vehicle Year / Make / Model"
              name="vehicle"
              placeholder="e.g., 2017 Hyundai Tucson 2.0L"
            />
            <Input label="VIN (optional)" name="vin" placeholder="17-digit VIN (optional)" />

            <div>
              <label className="mb-2 block text-sm font-semibold text-black/85">
                Message
              </label>
              <textarea
                name="message"
                rows={5}
                placeholder="Tell us what part you need, symptoms, or any details…"
                className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-black hover:opacity-90 transition"
            >
              Submit Request
            </button>

            <p className="text-xs text-black/75">
              Tip: Adding your VIN helps us confirm fitment faster.
            </p>
          </form>
        </div>

        {/* Right: Contact info */}
        <aside className="rounded-3xl border border-white/12 bg-black/25 p-6 backdrop-blur md:p-8">
          <h2 className="text-2xl font-semibold text-black">Contact Information</h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="text-sm font-semibold text-black">Phone</div>
              <a href={PHONE_LINK} className="mt-1 block text-sm text-black/75 hover:underline">
                +1 (548) 255-8778
              </a>
            </div>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-white/12 bg-emerald-500/25 p-4 text-black hover:bg-emerald-500/35 transition"
            >
              <div>
                <div className="text-sm font-semibold">Chat on WhatsApp</div>
                <div className="text-xs text-white/80">Fastest for quotes &amp; fitment</div>
              </div>
              <span className="text-lg">💬</span>
            </a>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="text-sm font-semibold text-black">Email</div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-1 block text-sm text-white/75 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="text-sm font-semibold text-black">Business Hours</div>
              <div className="mt-2 text-sm text-black/75 space-y-1">
                <div className="flex justify-between gap-3">
                  <span>Mon – Fri</span>
                  <span>9:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Saturday</span>
                  <span>11:00 AM – 4:00 PM</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-4">
              <div className="text-sm font-semibold text-black">Location</div>
              <div className="mt-1 text-sm text-black/75">Ontario, Canada</div>
            </div>
          </div>
        </aside>
      </section>

      {/* Stats */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat value="500+" label="Parts Delivered" />
        <Stat value="100+" label="Happy Customers" />
        <Stat value="98%" label="Satisfaction Rate" />
      </section>
    </main>
  );
}

function Input({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white/85" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
      />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/12 bg-black/25 p-6 text-center backdrop-blur">
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
    </div>
  );
}