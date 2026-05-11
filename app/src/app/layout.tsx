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
          WCAG 2.1 §2.4.1 skip-to-content link. Hidden until focused;
          jumps keyboard users past the persistent header chip on every
          route to the main-content anchor (mounted by each page's <main>
          element via id="main-content"; the anchor selector also matches
          the <main> tag itself as a fallback so old pages still work).
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:border focus:border-foreground/40 focus:bg-card/95 focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:tracking-[0.3em] focus:text-foreground focus:uppercase focus:shadow-xl focus:outline-none"
        >
          Skip to content
        </a>
        <CursorSpotlight />
        <TermProvider>
          <PrivyClientProvider>
            {/*
              Skip-link landing pad. tabIndex=-1 makes it programmatically
              focusable (via the skip-to-content link above) without
              joining the default tab order. aria-label gives screen
              readers a "main content" cue when focus lands here.
            */}
            <div id="main-content" tabIndex={-1} aria-label="Main content" />
            {children}
          </PrivyClientProvider>
        </TermProvider>
        <DemoCta />
      </body>
    </html>
  );
}
