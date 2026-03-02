import SiteHeader from "../components/SiteHeader";
import BrandWatermarkStatic from "../components/BrandWatermarkStatic";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="la-page-bg">
          <BrandWatermarkStatic />
          <SiteHeader />
          <main className="relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
