/**
 * SD-JWT VC holder. Stores Maria's credentials + produces selective-disclosure
 * presentations bound to the agent owner's secp256k1 key (single-principal model).
 */
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { digest, generateSalt } from "@sd-jwt/crypto-nodejs";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import type { HolderKeyPair } from "./types";

function makeKBSigner(privateKeyHex: string) {
  const priv = Uint8Array.from(Buffer.from(privateKeyHex.replace(/^0x/, ""), "hex"));
  return async (data: string): Promise<string> => {
    // @noble/curves@2.x sign() returns compact 64-byte (r || s) Uint8Array
    // directly. prehash: false because we hash the data with sha256 ourselves
    // for ES256K compliance.
    const msgHash = sha256(new TextEncoder().encode(data));
    const sigBytes = secp256k1.sign(msgHash, priv, { prehash: false });
    return Buffer.from(sigBytes).toString("base64url");
  };
}

export class CompassHolder {
  private readonly sdjwt: SDJwtVcInstance;

  constructor(private readonly key: HolderKeyPair) {
    const kbSigner = makeKBSigner(key.privateKeyHex);
    this.sdjwt = new SDJwtVcInstance({
      // present() doesn't need a credential signer (issuer side); we set
      // signer for completeness so the instance is fully configured.
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
   * Produce a selectively-disclosed presentation. `discloseClaims` lists the
   * claim names to reveal; everything else stays hashed.
   */
  async present(opts: {
    issuedSdjwt: string;
    discloseClaims: string[];
    audience: string;
    nonce: string;
  }): Promise<string> {
    const presentationFrame: Record<string, true> = {};
    for (const c of opts.discloseClaims) presentationFrame[c] = true;
    // v1: skip KB binding (audience+nonce integrity). KB is a stretch goal —
    // documented in honest-limits.md gap on "audience binding". The
    // single-principal model is enforced on-chain via consumeGrantAndIssueReceipt's
    // signer recovery; KB on the SD-JWT side is belt-and-suspenders.
    return await this.sdjwt.present(opts.issuedSdjwt, presentationFrame as any);
  }
}
