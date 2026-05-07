/**
 * dstack TDX attestation client. Generates an Ed25519 signing keypair on
 * boot and requests a TDX quote with reportData = sha256(pubkey || nonce).
 * The verifier extracts reportData from the quote, recomputes the hash,
 * and confirms the pubkey was generated inside this measured image.
 *
 * Talks to /var/run/dstack.sock (mounted from the Phala host).
 *
 *   curl -X POST --unix-socket /var/run/dstack.sock \
 *     -H 'Content-Type: application/json' \
 *     -d '{"reportData": "0x..."}' \
 *     http://dstack/GetQuote
 */
import { request as httpRequest } from "node:http";
import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";

const DSTACK_SOCK = "/var/run/dstack.sock";

export type AttestedSigner = {
  publicKeyHex: string;
  privateKeyBytes: Uint8Array;
  reportDataHex: string;
  quote: string;
  composeHash?: string;
};

function hex(bytes: Uint8Array): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}

export function buildReportData(publicKey: Uint8Array, nonce: Uint8Array): string {
  if (publicKey.length !== 32) throw new Error("Ed25519 pubkey must be 32 bytes");
  const buf = new Uint8Array(publicKey.length + nonce.length);
  buf.set(publicKey, 0);
  buf.set(nonce, publicKey.length);
  const digest = sha256(buf);
  // dstack reportData is up to 64 bytes; pad sha256 (32 bytes) to the right.
  const padded = new Uint8Array(64);
  padded.set(digest, 0);
  return hex(padded);
}

async function getQuote(reportDataHex: string): Promise<{ quote: string; composeHash?: string }> {
  return await new Promise((resolve, reject) => {
    const body = JSON.stringify({ reportData: reportDataHex });
    const req = httpRequest(
      {
        socketPath: DSTACK_SOCK,
        path: "/GetQuote",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            resolve({ quote: parsed.quote, composeHash: parsed.compose_hash });
          } catch (e) {
            reject(new Error(`failed to parse dstack response: ${(e as Error).message}`));
          }
        });
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Generate a fresh Ed25519 receipt-signer keypair inside the enclave and
 * obtain a TDX quote whose reportData binds the public key.
 */
export async function generateAttestedSigner(nonce: Uint8Array): Promise<AttestedSigner> {
  const privateKeyBytes = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKeyBytes);
  const reportDataHex = buildReportData(publicKey, nonce);
  const { quote, composeHash } = await getQuote(reportDataHex);
  return {
    publicKeyHex: hex(publicKey),
    privateKeyBytes,
    reportDataHex,
    quote,
    composeHash,
  };
}
