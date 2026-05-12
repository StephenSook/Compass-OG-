/**
 * SD-JWT VC issuer. Wraps SDJwtVcInstance with an Ed25519 signer.
 * Each Compass NGO fixture (HELP, Bethune, Hospital) is an Issuer instance.
 */
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { digest, generateSalt } from "@sd-jwt/crypto-nodejs";
import { ed25519 } from "@noble/curves/ed25519.js";
import type { ClaimSet, IssuerKeyPair } from "./types";

export type IssuedCredential = {
  /** Compact SD-JWT-VC string: `<jwt>~<disclosure>~<disclosure>~...~` */
  sdjwtvc: string;
  /** Issuer's did:key for trust-list lookup */
  issuerDid: string;
};

function makeSigner(privateKeyBytes: Uint8Array) {
  return async (data: string): Promise<string> => {
    const sig = ed25519.sign(new TextEncoder().encode(data), privateKeyBytes);
    return Buffer.from(sig).toString("base64url");
  };
}

export class CompassIssuer {
  readonly did: string;
  private readonly sdjwt: SDJwtVcInstance;

  constructor(private readonly key: IssuerKeyPair) {
    this.did = key.did;
    this.sdjwt = new SDJwtVcInstance({
      signer: makeSigner(key.privateKeyBytes),
      signAlg: "EdDSA",
      hasher: digest,
      hashAlg: "sha-256",
      saltGenerator: generateSalt,
    });
  }

  async issue(opts: {
    /** Maria's public-key JWK for `cnf` keybinding (secp256k1 / ES256K) */
    holderJwk: object;
    claims: ClaimSet;
    /** SD-JWT VC type — e.g., "compass:help-legal-aid" */
    vct: string;
    /** issued-at unix timestamp (seconds) */
    iat?: number;
    /** expiration unix timestamp (seconds) */
    exp?: number;
  }): Promise<IssuedCredential> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.did,
      vct: opts.vct,
      iat: opts.iat ?? now,
      exp: opts.exp ?? now + 60 * 60 * 24 * 30, // 30-day default
      cnf: { jwk: opts.holderJwk },
      ...opts.claims,
    };
    // Make every credential claim selectively disclosable.
    const disclosureFrame: Record<string, unknown> = { _sd: [] };
    const sdArr = disclosureFrame._sd as string[];
    for (const k of Object.keys(opts.claims)) sdArr.push(k);
    const sdjwtvc = await this.sdjwt.issue(payload as any, disclosureFrame as any);
    return { sdjwtvc, issuerDid: this.did };
  }
}
