import type { Metadata } from "next";
import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import { PrivyClientProvider } from "@/components/providers/PrivyClientProvider";
import { CursorSpotlight } from "@/components/primitives/CursorSpotlight";
import { DemoCta } from "@/components/primitives/DemoCta";
import { TermProvider } from "@/components/primitives/Term";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Compass — Prove eligibility, not identity",
  description:
    "A private eligibility firewall on 0G — vulnerable migrant workers prove they qualify for services through an autonomous agent, while clinics receive only non-identifying receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Preconnect hints — start TLS to Privy + 0G RPC before the user
          clicks anything. Privy initializes its auth iframe on /onboard;
          the public viem client connects to the active 0G RPC (Galileo
          today, Aristotle when NEXT_PUBLIC_COMPASS_USE_MAINNET=1) on
          every receipt-mint round trip. Marginal LCP win, no risk.
        */}
        <link rel="preconnect" href="https://auth.privy.io" />
        <link rel="preconnect" href="https://evmrpc.0g.ai" />
        <link rel="dns-prefetch" href="https://evmrpc-testnet.0g.ai" />
      </head>
      <body className="min-h-full flex flex-col">
        {/*
          Skip-to-content link: pending structural refactor in v0.7.
          The audit (2026-05-11) shipped a skip-link + landing pad, but
          the persistent COMPASS-chip <header> lives INSIDE each page's
          <main> element — focus from the landing pad therefore tabbed
          forward to the header link, defeating the skip. Code-review
          flagged this; the proper fix is moving <header> to layout
          and dropping it from every page (16 files). Filed as v0.7.
          Removed here to avoid advertising broken a11y. Tracked in
          docs/honest-limits.md §23.
        */}
        <CursorSpotlight />
        <TermProvider>
          <PrivyClientProvider>{children}</PrivyClientProvider>
        </TermProvider>
        <DemoCta />
      </body>
    </html>
  );
}
