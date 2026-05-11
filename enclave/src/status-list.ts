/**
 * Batched credential-revocation status lookup via the IETF OAuth Token
 * Status List draft (`@sd-jwt/jwt-status-list`).
 *
 * v1 verifier.ts skipped revocation (documented in docs/honest-limits.md
 * item 11). M.1 lands the batched primitive so multiple credentials that
 * share a status list URL resolve via a single HTTP fetch — privacy-
 * preserving against issuer-side correlation, and operationally cheaper.
 *
 * Wire-in is a v1.5 follow-up: the verifier chain inserts a revocation
 * check between "trust list" and "KB-JWT" steps. v1.5 will pass a
 * StatusListClient instance into the verifier; v1 leaves the constructor
 * stable so the seam exists for the future commit.
 */
import type { StatusList } from "@sd-jwt/jwt-status-list";

export type StatusListRef = {
  /** Full status-list URL (claim `status.status_list.uri`). */
  uri: string;
  /** Bitmap index within the list (claim `status.status_list.idx`). */
  idx: number;
};

export type StatusOutcome =
  | { revoked: false; index: number }
  | { revoked: true; index: number; reason: string };

type ParsedList = {
  fetchedAt: number;
  list: StatusList;
};

type FetchImpl = (uri: string) => Promise<Response>;

/**
 * Caches status-list bytes per-URI with a configurable TTL. Multiple
 * lookups against the same URI within the TTL window resolve from the
 * cache — that's the privacy primitive: an issuer that hosts a status
 * list cannot correlate two different credential checks to the same
 * verifier session beyond cache-miss frequency.
 */
export class StatusListClient {
  private cache = new Map<string, ParsedList>();
  private readonly ttlMs: number;
  private readonly fetchImpl: FetchImpl;
  private readonly statusListFromJWT: (jwt: string) => Promise<StatusList>;

  constructor(opts: {
    /** Cache TTL in milliseconds. Defaults to 60 minutes. */
    ttlMs?: number;
    /** Override fetch for testing or alternate transport. */
    fetchImpl?: FetchImpl;
    /** Parser injected so this module doesn't hard-fail at import if the
     *  @sd-jwt/jwt-status-list parser changes shape across versions. */
    statusListFromJWT: (jwt: string) => Promise<StatusList>;
  }) {
    this.ttlMs = opts.ttlMs ?? 60 * 60 * 1000;
    this.fetchImpl = opts.fetchImpl ?? ((u) => fetch(u));
    this.statusListFromJWT = opts.statusListFromJWT;
  }

  /**
   * Batch-resolve revocation status for multiple credentials. Refs sharing
   * the same `uri` collapse to a single fetch; the cached list serves all
   * indices in that group.
   */
  async resolveBatch(refs: StatusListRef[]): Promise<StatusOutcome[]> {
    const byUri = new Map<string, StatusListRef[]>();
    for (const r of refs) {
      const group = byUri.get(r.uri) ?? [];
      group.push(r);
      byUri.set(r.uri, group);
    }

    const outcomes: StatusOutcome[] = new Array(refs.length);
    const indexByRef = new Map<StatusListRef, number>();
    refs.forEach((r, i) => indexByRef.set(r, i));

    await Promise.all(
      Array.from(byUri.entries()).map(async ([uri, group]) => {
        const list = await this.getList(uri);
        for (const ref of group) {
          const outIdx = indexByRef.get(ref)!;
          const status = list.getStatus(ref.idx);
          // IETF jwt-status-list: status 0 = valid; 1 = invalid/revoked;
          // larger values are reserved for issuer-defined states (e.g.,
          // suspended). We treat anything non-zero as revoked.
          outcomes[outIdx] =
            status === 0
              ? { revoked: false, index: ref.idx }
              : { revoked: true, index: ref.idx, reason: `status=${status}` };
        }
      }),
    );

    return outcomes;
  }

  /** Single-credential convenience wrapper around resolveBatch. */
  async resolve(ref: StatusListRef): Promise<StatusOutcome> {
    const out = await this.resolveBatch([ref]);
    return out[0];
  }

  /** Force a refresh of the cached list for a given URI. */
  invalidate(uri: string): void {
    this.cache.delete(uri);
  }

  /** Drop all cached entries. */
  invalidateAll(): void {
    this.cache.clear();
  }

  private async getList(uri: string): Promise<StatusList> {
    const cached = this.cache.get(uri);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < this.ttlMs) {
      return cached.list;
    }
    const res = await this.fetchImpl(uri);
    if (!res.ok) {
      // Fail-closed per docs/honest-limits.md item 6: a verifier that
      // cannot reach the status list MUST NOT silently treat the
      // credential as valid.
      throw new StatusListFetchError(uri, res.status);
    }
    const jwt = await res.text();
    const list = await this.statusListFromJWT(jwt);
    this.cache.set(uri, { fetchedAt: now, list });
    return list;
  }
}

export class StatusListFetchError extends Error {
  readonly code = "status-list-unreachable";
  constructor(public readonly uri: string, public readonly httpStatus: number) {
    super(`status list fetch failed: HTTP ${httpStatus} from ${uri}`);
  }
}
