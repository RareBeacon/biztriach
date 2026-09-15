import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Biztriach — AI Agents & Automations for Your Business",
  description:
    "Deploy AI agents on WhatsApp and your website that sound like you. Trained on your business, they answer customers in seconds, capture leads, log sales and report everything — automatically.",
  keywords: [
    "Biztriach",
    "AI agents",
    "AI automations",
    "WhatsApp AI agent",
    "website chat AI",
    "AI customer support",
    "lead capture AI",
    "business automation Nigeria",
  ],
  openGraph: {
    title: "Biztriach — AI Agents That Sell, Support & Never Sleep",
    description: "Train once, deploy everywhere. AI agents on WhatsApp and your website — talking in your voice, capturing leads 24/7.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
