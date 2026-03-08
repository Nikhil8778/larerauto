import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold text-white">LARE Automotive Supply</span>{" "}
            — Ontario, Canada
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white">
              Retail + Online
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white">
              Mechanics Welcome
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white">
              Premium + Budget
            </span>
          </div>

          <div className="flex items-center gap-4 text-xl text-white">
            <a
              href="https://facebook.com/lareauto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition hover:text-blue-500"
            >
              <FaFacebook />
            </a>

            <a
              href="https://instagram.com/lareauto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition hover:text-pink-500"
            >
              <FaInstagram />
            </a>

            <a
              href="https://linkedin.com/company/lareauto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="transition hover:text-blue-400"
            >
              <FaLinkedin />
            </a>

            <a
              href="https://youtube.com/@lareauto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="transition hover:text-red-500"
            >
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}