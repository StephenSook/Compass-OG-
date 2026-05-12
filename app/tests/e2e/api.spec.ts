import { expect, test } from "@playwright/test";

// API endpoint smoke tests. /api/issue and /api/consume have env-gated
// fallback paths (503) that we can exercise without a wallet flow. The
// real-flow happy paths are wallet-gated and left for manual click-through.

test("GET /api/tee-status returns a valid mode", async ({ request }) => {
  const res = await request.get("/api/tee-status");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { mode?: string; reachable?: boolean };
  expect(body.mode).toBeTruthy();
  expect(["tee", "env", "degraded", "unconfigured"]).toContain(body.mode);
});

test("POST /api/issue rejects missing-env state with 503 OR signs with 200", async ({ request }) => {
  // The route returns 503 when ISSUER_PRIVATE_KEY is unset, 200 with a
  // signed SD-JWT VC when set. Either is correct depending on deploy env.
  const res = await request.post("/api/issue", {
    data: {
      vct: "https://compass.0g.ai/vct/help-fdh.v1",
      claims: { is_FDH_in_HK: true, has_pending_case: true },
      holderAddress: "0x1111111111111111111111111111111111111111",
    },
  });
  expect([200, 503]).toContain(res.status());
  const body = (await res.json()) as { sdjwtvc?: string; error?: string };
  if (res.status() === 200) {
    expect(body.sdjwtvc).toBeTruthy();
    expect(body.sdjwtvc!.length).toBeGreaterThan(50);
  } else {
    expect(body.error).toBe("issuer_unconfigured");
  }
});

test("POST /api/consume rejects malformed body with 400", async ({ request }) => {
  const res = await request.post("/api/consume", { data: { not: "a grant" } });
  // 400 bad_request OR 503 if PROVIDER_PRIVATE_KEY unset (env-gated check
  // runs first per route order; assert either)
  expect([400, 503]).toContain(res.status());
});

test("POST /api/consume rejects missing-sig with bad-request error", async ({ request }) => {
  const res = await request.post("/api/consume", {
    data: {
      grant: {
        agentTokenId: "1",
        policyId: "0x21b8b0e65ae28bfbae2096e8a9b7bc245d92d5e56fb74ca989c1a551b4c2d08f",
        provider: "0xaD736a7233847Cf1D73a7D820b32424CF8125b0a",
        nonce: "1",
        expiry: 9999999999,
        nullifier: "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
      // sig deliberately omitted
    },
  });
  expect([400, 503]).toContain(res.status());
});
