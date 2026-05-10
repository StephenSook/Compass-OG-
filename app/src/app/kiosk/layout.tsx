import type { ReactNode } from "react";

/**
 * Kiosk layout — strips the nav pill present in the rest of the app so a
 * drop-in NGO tablet doesn't have a back button to the marketing surface.
 * The visitor's path is forward-only until reset.
 */
export default function KioskLayout({ children }: { children: ReactNode }) {
  return <div className="kiosk-shell relative flex min-h-screen flex-col">{children}</div>;
}
