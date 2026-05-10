import { defineConfig, devices } from "@playwright/test";

// BASE_URL controls where the suite runs:
//  - http://localhost:3000      → run against `next dev` (slow first-compile
//                                 on Next 16 + many deps; ~5-15min/route on
//                                 cold cache, then fast on warm)
//  - https://app-XYZ-...vercel.app → run against a Vercel deployment;
//                                    requires VERCEL_BYPASS_TOKEN to clear
//                                    deployment-protection SSO
//  - https://app-psi-pied.vercel.app → canonical alias (also SSO-gated)
//
// The bypass cookie is set via `?x-vercel-set-bypass-cookie=true&
// x-vercel-protection-bypass=<token>` on the first navigation; subsequent
// requests in the same context inherit the cookie.
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const VERCEL_BYPASS_TOKEN = process.env.VERCEL_BYPASS_TOKEN;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    extraHTTPHeaders: VERCEL_BYPASS_TOKEN
      ? { "x-vercel-protection-bypass": VERCEL_BYPASS_TOKEN }
      : undefined,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
