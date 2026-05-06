/**
 * Keypair helpers — Ed25519 for issuers (smaller did:key form),
 * secp256k1 for the holder (matches Privy / EVM single-principal model).
 */
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { base58 } from "@scure/base";
import type { IssuerKeyPair, HolderKeyPair } from "./types";

/**
 * Encode an Ed25519 public key as a did:key identifier.
 * Multicodec 0xed01 (Ed25519) prefix + multibase base58btc.
 */
export function ed25519DidKey(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) {
    throw new Error(`Ed25519 public key must be 32 bytes, got ${publicKey.length}`);
  }
  // Multicodec varint for Ed25519 = 0xed 0x01
  const prefix = new Uint8Array([0xed, 0x01]);
  const buf = new Uint8Array(prefix.length + publicKey.length);
  buf.set(prefix, 0);
  buf.set(publicKey, prefix.length);
  // Multibase prefix `z` = base58btc
  return `did:key:z${base58.encode(buf)}`;
}

export function generateIssuerKeyPair(): IssuerKeyPair {
  const privateKeyBytes = ed25519.utils.randomSecretKey();
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
  const did = ed25519DidKey(publicKeyBytes);
  return { did, privateKeyBytes, publicKeyBytes };
}

/**
 * Derive a deterministic issuer key from a seed string. Used for fixture
 * issuers (HELP, Bethune, Hospital) so the demo is reproducible.
 */
export function deterministicIssuerKeyPair(seed: string): IssuerKeyPair {
  const privateKeyBytes = sha256(new TextEncoder().encode(seed));
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
  const did = ed25519DidKey(publicKeyBytes);
  return { did, privateKeyBytes, publicKeyBytes };
}

export function generateHolderKeyPair(): HolderKeyPair {
  const privateKeyBytes = secp256k1.utils.randomSecretKey();
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false); // uncompressed (0x04 + X + Y)
  const privateKeyHex = "0x" + Buffer.from(privateKeyBytes).toString("hex");
  const publicKeyHex = "0x" + Buffer.from(publicKeyBytes).toString("hex");
  // Build JWK from uncompressed pub key (skip 0x04 prefix)
  const xBytes = publicKeyBytes.slice(1, 33);
  const yBytes = publicKeyBytes.slice(33, 65);
  const b64url = (b: Uint8Array): string =>
    Buffer.from(b).toString("base64url");
  return {
    privateKeyHex,
    publicKeyHex,
    jwk: {
      kty: "EC",
      crv: "secp256k1",
      x: b64url(xBytes),
      y: b64url(yBytes),
    },
  };
}

export function deterministicHolderKeyPair(seed: string): HolderKeyPair {
  const privateKeyBytes = sha256(new TextEncoder().encode(seed));
  const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
  const privateKeyHex = "0x" + Buffer.from(privateKeyBytes).toString("hex");
  const publicKeyHex = "0x" + Buffer.from(publicKeyBytes).toString("hex");
  const xBytes = publicKeyBytes.slice(1, 33);
  const yBytes = publicKeyBytes.slice(33, 65);
  const b64url = (b: Uint8Array): string =>
    Buffer.from(b).toString("base64url");
  return {
    privateKeyHex,
    publicKeyHex,
    jwk: {
      kty: "EC",
      crv: "secp256k1",
      x: b64url(xBytes),
      y: b64url(yBytes),
    },
  };
}
