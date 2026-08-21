import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuShield — Audit contratti con Google Gemini AI",
  description:
    "Analizza contratti e documenti di conformità (NDA, fornitore software, GDPR) con IA via Google Gemini.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${geistSans.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
