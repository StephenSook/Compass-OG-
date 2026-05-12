/**
 * Trust list verification. v1 uses a simple Set<DID> per agent. v2 will
 * verify a Merkle proof against agentRegistry.agents[tokenId].trustListRoot.
 */

export class TrustList {
  private readonly trusted: Set<string>;

  constructor(trustedDids: string[]) {
    this.trusted = new Set(trustedDids);
  }

  isTrusted(issuerDid: string): boolean {
    return this.trusted.has(issuerDid);
  }

  size(): number {
    return this.trusted.size;
  }
}

/** Helper to build a trust list from policy.trustedIssuers. */
export function buildTrustList(trustedDids: string[]): TrustList {
  return new TrustList(trustedDids);
}
