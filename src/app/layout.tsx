import type { Metadata } from "next";
import { Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { GoogleConsentDefaults } from "@/components/consent/GoogleConsentDefaults";
import "./globals.css";

const headlineFont = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-headline",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "01 Haberler — Türkiye ve Dünyadan Güncel Haberler",
    template: "%s | 01 Haberler",
  },
  description: "01 Haberler; son dakika, gündem, ekonomi, spor ve daha fazlasında güncel haberleri sunar.",
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${headlineFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <head>
        <ThemeScript />
        <GoogleConsentDefaults />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
