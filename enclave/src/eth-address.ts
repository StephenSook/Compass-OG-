import { keccak_256 } from "@noble/hashes/sha3.js";

export function deriveEthAddressFromUncompressed(uncompressed: Uint8Array): string {
  if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
    throw new Error(`expected 65-byte uncompressed secp256k1 pubkey, got ${uncompressed.length}`);
  }
  return "0x" + Buffer.from(keccak_256(uncompressed.slice(1)).slice(-20)).toString("hex");
}
