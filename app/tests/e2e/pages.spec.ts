import { expect, test } from "@playwright/test";

// Page-render smoke tests. Each route should serve 200 + the load-bearing
// copy/heading rendered server-side. We don't assert exact pixel layout —
// that's a visual-regression problem outside this suite.

test.describe("static page renders", () => {
  test("/ — hero copy + CTAs visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("A Private Eligibility Firewall on 0G", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Onboard Maria/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open the vault/i })).toBeVisible();
  });

  test("/about — reality table + TEE status badge", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("Bounded", { exact: false })).toBeVisible();
    await expect(page.getByText("What's real / what's mocked")).toBeVisible();
    await expect(page.getByText("AgentRegistry contract")).toBeVisible();
    // Reality row added in A.4 — RA-quote-bound digest must show real
    await expect(
      page.getByText("RA-quote-bound attestationDigest in receipts", { exact: false }),
    ).toBeVisible();
    // TEE status badge — rendered after fetch; mode label appears within 10s
    await expect(
      page.locator("text=/tee live|env-mode|enclave unreachable|unconfigured|probe failed/i"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("/vault — fixture credentials render", async ({ page }) => {
    await page.goto("/vault");
    await expect(page.getByText("Maria's", { exact: false })).toBeVisible();
    await expect(page.getByText("HELP for Domestic Workers", { exact: false })).toBeVisible();
    await expect(page.getByText("Bethune House Migrant Women's Refuge")).toBeVisible();
  });

  test("/clinic/subpoena — italic load-bearing line", async ({ page }) => {
    await page.goto("/clinic/subpoena");
    await expect(page.getByText("Investigation Request", { exact: false })).toBeVisible();
    await expect(page.getByText("That's all that exists", { exact: false })).toBeVisible();
    await expect(page.getByText("No name. No HKID. No employer", { exact: false })).toBeVisible();
  });

  test("/clinic/inbox — receipt rows render", async ({ page }) => {
    await page.goto("/clinic/inbox");
    await expect(page.getByText(/Receipt Inbox/i)).toBeVisible();
  });

  test("/audit — public log renders", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.getByText(/Public audit log/i)).toBeVisible();
  });

  test("/policies/help-legal-aid — policy detail renders", async ({ page }) => {
    await page.goto("/policies/help-legal-aid");
    await expect(page.getByText(/HELP for Domestic Workers/i)).toBeVisible();
  });

  test("/receipt/1 — receipt detail renders", async ({ page }) => {
    await page.goto("/receipt/1");
    // Receipt #1 is the canonical fixture used by the subpoena CTA
    await expect(page.locator("body")).not.toContainText(/notFound/i);
  });

  test("/onboard — step structure visible", async ({ page }) => {
    await page.goto("/onboard");
    await expect(page.getByText(/in three steps/i)).toBeVisible();
    await expect(page.getByText(/Connect wallet/i)).toBeVisible();
    await expect(page.getByText(/Mint the agent/i)).toBeVisible();
    await expect(page.getByText(/Issue demo credential/i)).toBeVisible();
  });
});
