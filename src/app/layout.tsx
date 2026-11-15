import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SmileAssistant } from "@/components/SmileAssistant";

const display = localFont({
  variable: "--font-newsreader",
  display: "swap",
  src: [
    { path: "../fonts/newsreader-latin-wght-normal.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/newsreader-latin-wght-italic.woff2", weight: "200 800", style: "italic" },
  ],
});
const sans = localFont({
  variable: "--font-figtree",
  display: "swap",
  src: [{ path: "../fonts/figtree-latin-wght-normal.woff2", weight: "300 900", style: "normal" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Dentivora | Modern dentistry in Austin, Texas", template: "%s | Dentivora" },
  description: "Thoughtful, modern dental care. Book a check-up, cleaning, whitening or any treatment online in minutes.",
  openGraph: { title: "Dentivora", description: "Modern dentistry. Thoughtful care. A healthier smile.", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f6f2ea", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <SmoothScroll />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <SmileAssistant />
      </body>
    </html>
  );
}
