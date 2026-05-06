/**
 * SD-JWT VC holder. Stores Maria's credentials + produces selective-disclosure
 * presentations bound to the agent owner's secp256k1 key.
 *
 * v2 enforces RFC-draft Key Binding (KB-JWT): the holder signs an inner JWT
 * over { aud, nonce, iat, sd_hash } with the same secp256k1 key declared in
 * the credential's `cnf.jwk` claim. The verifier MUST reject presentations
 * with no KB-JWT or with a KB-JWT whose key does not match `cnf.jwk`.
 */
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { digest, generateSalt } from "@sd-jwt/crypto-nodejs";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import type { HolderKeyPair } from "./types";

function makeKBSigner(privateKeyHex: string) {
  const priv = Uint8Array.from(Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex"));
  return async (data: string): Promise<string> => {
    const msgHash = sha256(new TextEncoder().encode(data));
    // Force low-S to match common ES256K verifiers and avoid signature
    // malleability (ES256K accepts both r,s and r,n-s; pin to canonical).
    const sig = secp256k1.sign(msgHash, priv, { prehash: false, lowS: true });
    return Buffer.from(sig).toString("base64url");
  };
}

export class CompassHolder {
  private readonly sdjwt: SDJwtVcInstance;

  constructor(private readonly key: HolderKeyPair) {
    const kbSigner = makeKBSigner(key.privateKeyHex);
    this.sdjwt = new SDJwtVcInstance({
      signer: kbSigner,
      signAlg: "ES256K",
      kbSigner,
      kbSignAlg: "ES256K",
      hasher: digest,
      hashAlg: "sha-256",
      saltGenerator: generateSalt,
    });
  }

  /**
   * Produce a selectively-disclosed presentation with KB-JWT bound to
   * { aud, nonce, iat }. Verifier rejects if KB-JWT missing, audience
   * mismatches, nonce mismatches, or sig fails against `cnf.jwk`.
   */
  async present(opts: {
    issuedSdjwt: string;
    discloseClaims: string[];
    audience: string;
    nonce: string;
    /** Override clock for deterministic fixtures. */
    iat?: number;
  }): Promise<string> {
    const presentationFrame: Record<string, true> = {};
    for (const c of opts.discloseClaims) presentationFrame[c] = true;
    return await this.sdjwt.present(opts.issuedSdjwt, presentationFrame as any, {
      kb: {
        payload: {
          aud: opts.audience,
          nonce: opts.nonce,
          iat: opts.iat ?? Math.floor(Date.now() / 1000),
        },
      },
    });
  }
}
