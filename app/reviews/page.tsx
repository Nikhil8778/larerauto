import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Customer Reviews | Lare Auto",
  description:
    "Read verified customer reviews for Lare Auto. See what drivers, DIYers, and repair shops say about our parts, pricing, and support.",
};

type Review = {
  name: string;
  location: string;
  product: string;
  rating: number;
  dateLabel: string;
  text: string;
  avatarSrc: string;
};

const reviews: Review[] = [
  {
    name: "Mike Thompson",
    location: "Ontario",
    product: "Alternator",
    rating: 5,
    dateLabel: "2 days ago",
    text: "Ordered brake pads for my Hyundai Tucson. Delivery was quick and the part fit perfectly. Great service!",
    avatarSrc: "/reviews/avatars/mike.png",
  },
  {
    name: "Sukhwinder",
    location: "Brampton",
    product: "Shock and Struts",
    rating: 5,
    dateLabel: "4 days ago",
    text: "Been ordering parts from Lare Auto for over a year. Always reliable, fast, and affordable. Five stars from me!",
    avatarSrc: "/reviews/avatars/sukhwinder.png",
  },
  {
    name: "John Liu",
    location: "Kitchener",
    product: "Rotors & Brake Pads",
    rating: 5,
    dateLabel: "1 week ago",
    text: "Lare Auto’s inventory is so helpful. They helped me find a hard-to-get part fast. Definitely my go-to shop.",
    avatarSrc: "/reviews/avatars/John.png",
  },
];

function Stars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1" aria-label={`${full} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "text-amber-300" : "text-white/25"}>
          ★
        </span>
      ))}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/85">
      {children}
    </span>
  );
}

export default function ReviewsPage() {
  return (
    // IMPORTANT: no background is set here so your existing site background remains
    <main className="w-full">
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-10 md:pt-14">
        {/* HERO */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-black md:text-5xl">
            Customer Reviews
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Stars value={5} />
            <span className="text-white/80">
              <span className="font-semibold text-white">100+</span> verified customers
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Pill>
              <span className="text-black/90">Google</span>
            </Pill>
            <Pill>
              <span className="text-black/90">Trustpilot</span>
            </Pill>
            <Pill>
              <span className="text-black/90">Facebook</span>
            </Pill>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* LEFT: Review cards */}
          <div className="lg:col-span-2 space-y-5">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="rounded-3xl border border-white/12 bg-black/25 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex items-start gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/12 bg-white/5"
                  >
                    <Image
                      src={r.avatarSrc}
                      alt={`${r.name} avatar`}
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-black">
                        <span className="font-semibold">{r.name}</span>
                        <span className="text-white/80"> — {r.location}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-black/80">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          Verified Review
                        </span>
                        
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      <span className="text-xs text-white/80">{r.dateLabel}</span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      “{r.text}”
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-white/80">🧰 {r.product}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Customer photos */}
          <aside className="rounded-3xl border border-white/12 bg-black/25 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Customer Photos</h2>
              <div className="text-white/60 text-sm">›</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/12 bg-white/5">
                <Image src="/reviews/photos/photo1.png" alt="Customer photo 1" fill className="object-contain" />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/12 bg-white/5">
                <Image src="/reviews/photos/photo2.png" alt="Customer photo 2" fill className="object-contain" />
              </div>
            </div>

            <div className="mt-3 relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/12 bg-white/5">
              <Image src="/reviews/photos/photo3.png" alt="Customer photo 3" fill className="object-contain" />
            </div>

            <Link
              href="/reviews/photos"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              See All Photos →
            </Link>

            <div className="mt-5 relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/12 bg-white/5">
              <Image src="/reviews/photos/photo4.png" alt="Customer photo 4" fill className="object-contain" />
            </div>

            <Link
              href="/reviews/photos"
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              See All Photos →
            </Link>
          </aside>
        </div>

        {/* LOVE SECTION */}
        <div className="mt-12 rounded-3xl border border-white/12 bg-black/25 p-6 text-center backdrop-blur">
          <h3 className="text-2xl font-semibold text-white">Customers Love Lare Auto For</h3>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-3xl">🛡️</div>
              <div className="mt-3 text-lg font-semibold text-white">Reliability</div>
              <p className="mt-2 text-sm text-white/75">
                Trusted quality parts and dependable sourcing.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-3xl">🚚</div>
              <div className="mt-3 text-lg font-semibold text-white">Fast fulfillment</div>
              <p className="mt-2 text-sm text-white/75">
                Same/next day shipping options across Canada.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-3xl">🤝</div>
              <div className="mt-3 text-lg font-semibold text-white">Helpful support</div>
              <p className="mt-2 text-sm text-white/75">
                Real humans ready to help with fitment and quotes.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="https://www.google.com/search?q=Lare+Auto+reviews"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
            >
              Leave a Google Review →
            </Link>

            <Link
              href="/reviews/write"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Write a Website Review →
            </Link>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/12 bg-black/25 p-6 backdrop-blur">
            <div className="text-3xl font-semibold text-white">500+</div>
            <div className="mt-1 text-sm text-white/70">Parts delivered</div>
          </div>
          <div className="rounded-3xl border border-white/12 bg-black/25 p-6 backdrop-blur">
            <div className="text-3xl font-semibold text-white">100+</div>
            <div className="mt-1 text-sm text-white/70">Happy customers</div>
          </div>
          <div className="rounded-3xl border border-white/12 bg-black/25 p-6 backdrop-blur">
            <div className="text-3xl font-semibold text-white">98%</div>
            <div className="mt-1 text-sm text-white/70">Satisfaction rate</div>
          </div>
        </div>
      </section>
    </main>
  );
}
