import type { Metadata, Viewport } from "next";
import SiteHeader from "../components/SiteHeader";
import BrandWatermarkStatic from "../components/BrandWatermarkStatic";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lare Auto",
  description: "Auto parts website",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-w-0 overflow-x-hidden">
        <div className="la-page-bg min-h-screen overflow-x-hidden">
          <BrandWatermarkStatic />
          <SiteHeader />
          <main className="relative z-10 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}