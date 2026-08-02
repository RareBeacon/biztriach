import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biztriach - AI Business Platform for SMEs",
  description:
    "One AI employee for your entire business. Customer support, sales, inventory, WhatsApp, landing pages, and financial reports — all automated with AI. Built for supermarkets, restaurants, clinics, real estate & more.",
  keywords: [
    "Biztriach",
    "AI business platform",
    "AI customer support",
    "SME business automation",
    "WhatsApp business AI",
    "inventory management AI",
    "AI employee",
    "business management platform Nigeria"
  ],
  openGraph: {
    title: "Biztriach - One AI Employee for Your Entire Business",
    description: "Train once, deploy everywhere. Support, sales, inventory & growth — automated.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-inter bg-white text-slate-900 selection:bg-violet-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
