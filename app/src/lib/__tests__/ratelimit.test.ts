import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  check,
  createBucketStore,
  evictOldest,
  extractClientIp,
} from "../ratelimit";

describe("ratelimit/check", () => {
  it("allows 5 requests in window, blocks the 6th", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
      const r = check(store, "ip-a", t0 + i * 10);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.remaining).toBe(5 - i - 1);
    }
    const blocked = check(store, "ip-a", t0 + 100);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetMs).toBeGreaterThan(0);
      expect(blocked.resetMs).toBeLessThanOrEqual(60_000);
    }
  });

  it("admits a new request once the window slides", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) check(store, "ip-a", t0 + i);
    // At t0 + WINDOW_MS, the first timestamp falls out of the window.
    const r = check(store, "ip-a", t0 + 60_001);
    expect(r.ok).toBe(true);
  });

  it("computes resetMs from the oldest live timestamp", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) check(store, "ip-a", t0 + i * 1_000);
    // Oldest timestamp is t0; window expires at t0 + 60_000. Probe at
    // t0 + 5_000 → reset = ~55_000ms.
    const blocked = check(store, "ip-a", t0 + 5_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.resetMs).toBeGreaterThanOrEqual(55_000);
      expect(blocked.resetMs).toBeLessThanOrEqual(56_000);
    }
  });

  it("isolates buckets per key", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) check(store, "ip-a", t0);
    const other = check(store, "ip-b", t0);
    expect(other.ok).toBe(true);
  });

  it("never returns negative resetMs", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) check(store, "ip-a", t0 + i);
    // Probe far in the future — oldest entry is already expired.
    const r = check(store, "ip-a", t0 + 1_000_000);
    expect(r.ok).toBe(true);
    expect(r.resetMs).toBeGreaterThanOrEqual(0);
  });
});

describe("ratelimit/extractClientIp", () => {
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    delete process.env.VERCEL;
  });

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("returns shared-bucket when not on Vercel (header-spoof guard)", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
    });
    expect(extractClientIp(headers)).toBe("shared-bucket");
  });

  it("trusts x-forwarded-for when VERCEL=1 (edge sets it)", () => {
    process.env.VERCEL = "1";
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(extractClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for absent under VERCEL=1", () => {
    process.env.VERCEL = "1";
    const headers = new Headers({ "x-real-ip": "9.8.7.6" });
    expect(extractClientIp(headers)).toBe("9.8.7.6");
  });
});

describe("ratelimit/evictOldest", () => {
  it("deletes buckets whose entries have all aged out", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    store.set("expired-a", [t0 - 90_000, t0 - 80_000]);
    store.set("expired-b", [t0 - 70_000]);
    store.set("live", [t0 - 30_000, t0 - 10_000]);
    const deleted = evictOldest(store, t0);
    expect(deleted).toBe(2);
    expect(store.has("expired-a")).toBe(false);
    expect(store.has("expired-b")).toBe(false);
    expect(store.has("live")).toBe(true);
  });

  it("half-prunes buckets with partial expirations", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    store.set("mixed", [t0 - 90_000, t0 - 30_000]);
    evictOldest(store, t0);
    expect(store.get("mixed")).toEqual([t0 - 30_000]);
  });

  it("returns 0 when no buckets are evictable (flood scenario)", () => {
    const store = createBucketStore();
    const t0 = 1_000_000;
    for (let i = 0; i < 100; i++) store.set(`flood-${i}`, [t0 - 10]);
    const deleted = evictOldest(store, t0);
    expect(deleted).toBe(0);
    expect(store.size).toBe(100);
  });
});
