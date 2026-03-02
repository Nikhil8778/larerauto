export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} <span className="font-bold text-white">LARE Automotive Supply</span> — Sudbury, ON
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white">Retail + Online</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white">Mechanics Welcome</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white">Premium + Budget</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
