import { describe, it, expect, beforeEach } from "vitest";
import type { StatusList } from "@sd-jwt/jwt-status-list";
import { StatusListClient, type StatusListRef } from "../src/status-list";

// Minimal in-memory StatusList stub matching the @sd-jwt/jwt-status-list
// shape we depend on (getStatus(idx) → number). Keeps the test isolated
// from network + spec drift.
function fakeStatusList(statuses: number[]): StatusList {
  return {
    getStatus(idx: number) {
      if (idx < 0 || idx >= statuses.length) {
        throw new Error(`idx out of range: ${idx}`);
      }
      return statuses[idx];
    },
  } as unknown as StatusList;
}

describe("StatusListClient — batched revocation primitive", () => {
  let fetchCallCount: Map<string, number>;
  let lists: Map<string, number[]>;

  beforeEach(() => {
    fetchCallCount = new Map();
    lists = new Map();
  });

  function mk(): StatusListClient {
    return new StatusListClient({
      ttlMs: 60_000,
      fetchImpl: async (uri: string) => {
        fetchCallCount.set(uri, (fetchCallCount.get(uri) ?? 0) + 1);
        const arr = lists.get(uri);
        if (!arr) return new Response("not found", { status: 404 });
        return new Response(JSON.stringify(arr), { status: 200 });
      },
      statusListFromJWT: async (jwtBody: string) => {
        const arr = JSON.parse(jwtBody) as number[];
        return fakeStatusList(arr);
      },
    });
  }

  it("returns revoked=false for status=0", async () => {
    lists.set("https://help.example/list-1", [0, 0, 0]);
    const client = mk();
    const out = await client.resolve({ uri: "https://help.example/list-1", idx: 0 });
    expect(out.revoked).toBe(false);
  });

  it("returns revoked=true for any non-zero status", async () => {
    lists.set("https://help.example/list-1", [0, 1, 0]);
    const client = mk();
    const out = await client.resolve({ uri: "https://help.example/list-1", idx: 1 });
    expect(out.revoked).toBe(true);
    if (out.revoked) expect(out.reason).toContain("status=1");
  });

  it("batches multiple refs sharing a URI into ONE fetch", async () => {
    lists.set("https://help.example/list-A", [0, 1, 0, 1]);
    const client = mk();
    const refs: StatusListRef[] = [
      { uri: "https://help.example/list-A", idx: 0 },
      { uri: "https://help.example/list-A", idx: 1 },
      { uri: "https://help.example/list-A", idx: 3 },
    ];
    const out = await client.resolveBatch(refs);
    expect(out.map((o) => o.revoked)).toEqual([false, true, true]);
    expect(fetchCallCount.get("https://help.example/list-A")).toBe(1);
  });

  it("preserves input order in the output array even with duplicate URIs", async () => {
    lists.set("https://a.example/L", [0, 1]);
    lists.set("https://b.example/L", [1, 0]);
    const client = mk();
    const out = await client.resolveBatch([
      { uri: "https://b.example/L", idx: 0 }, // revoked
      { uri: "https://a.example/L", idx: 0 }, // valid
      { uri: "https://b.example/L", idx: 1 }, // valid
      { uri: "https://a.example/L", idx: 1 }, // revoked
    ]);
    expect(out.map((o) => o.revoked)).toEqual([true, false, false, true]);
  });

  it("caches subsequent lookups within TTL — second resolve does not refetch", async () => {
    lists.set("https://help.example/list-A", [0, 0, 0]);
    const client = mk();
    await client.resolve({ uri: "https://help.example/list-A", idx: 0 });
    await client.resolve({ uri: "https://help.example/list-A", idx: 1 });
    await client.resolve({ uri: "https://help.example/list-A", idx: 2 });
    expect(fetchCallCount.get("https://help.example/list-A")).toBe(1);
  });

  it("invalidate(uri) forces a fresh fetch on next resolve", async () => {
    lists.set("https://help.example/list-A", [0, 0]);
    const client = mk();
    await client.resolve({ uri: "https://help.example/list-A", idx: 0 });
    client.invalidate("https://help.example/list-A");
    await client.resolve({ uri: "https://help.example/list-A", idx: 0 });
    expect(fetchCallCount.get("https://help.example/list-A")).toBe(2);
  });

  it("FAILS CLOSED on fetch failure (no silent valid-by-default)", async () => {
    // Don't seed the URI — fetchImpl returns 404
    const client = mk();
    await expect(
      client.resolve({ uri: "https://unreachable.example/list", idx: 0 }),
    ).rejects.toThrow(/HTTP 404/);
  });

  it("invalidateAll() clears every cached list", async () => {
    lists.set("https://a.example/L", [0]);
    lists.set("https://b.example/L", [0]);
    const client = mk();
    await client.resolve({ uri: "https://a.example/L", idx: 0 });
    await client.resolve({ uri: "https://b.example/L", idx: 0 });
    client.invalidateAll();
    await client.resolve({ uri: "https://a.example/L", idx: 0 });
    await client.resolve({ uri: "https://b.example/L", idx: 0 });
    expect(fetchCallCount.get("https://a.example/L")).toBe(2);
    expect(fetchCallCount.get("https://b.example/L")).toBe(2);
  });
});
