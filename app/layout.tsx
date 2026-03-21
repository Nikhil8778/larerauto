import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ChatbotWidget from "@/components/ChatbotWidget";

export const metadata: Metadata = {
  title: "Lare Auto",
  description: "Premium auto parts website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="la-page-bg">
        <div className="la-static-watermark">
          <div className="la-static-watermark-inner">
            <div className="la-static-watermark-row">
              <span>Honda</span>
              <span>Toyota</span>
              <span>Audi</span>
              <span>Ram</span>
            </div>
            <div className="la-static-watermark-row">
              <span>Hyundai</span>
              <span>Mercedes</span>
              <span>Nissan</span>
            </div>
            <div className="la-static-watermark-row">
              <span>Ford</span>
               <span>BMW</span>
              <span>Mazda</span>
            </div>
          </div>
        </div>

        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />

        <ChatbotWidget />
      </body>
    </html>
  );
}