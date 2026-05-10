// Server-side helper to fetch a real RA-quote-bound attestation digest from
// the live Phala TDX enclave (`enclave/` workspace, deployed per
// docs/notes/phala-deployment.md).
//
// /api/consume calls callEnclave() with the receipt's identifying fields. The
// enclave wraps the receipt in OpenAI completion shape (the 0G broker
// forwarding contract), evaluates the HELP policy against the fixture
// claims, signs the canonicalized receipt with a TEE-derived secp256k1 key,
// and ALSO returns a per-receipt TDX quote whose report_data binds
// (signer || composeHash || receiptId) — the cryptographic chain the
// verify-receipt CLI re-checks.
//
// This module is server-only (uses fetch + Node Buffer). Don't import from
// client components.

const COMPASS_VERIFIER_PUB_KEY =
  "0x04f5a0e25cba6f1eaa53fffd6dd8f9fe0a6c7b39b18b4f5e2c4d7a8b3e6c5f9d2a4e7b8c1d3a5e6f8b2c4d7a9e1c3f5b7d9a2e4c6f8b1d3a5e7c9f2b4d6a8e0c2";

export type EnclaveResponseSlim = {
  attestationDigest: `0x${string}`;
  signature: `0x${string}`;
  signerAddress: `0x${string}`;
  perReceiptQuoteHex: `0x${string}` | null;
  receiptVersion: string;
  source: "tee" | "env";
};

export type EnclaveCallInputs = {
  receiptId: `0x${string}`;
  challenge: `0x${string}`;
  policyHash: `0x${string}`;
  agentIdCommitment: `0x${string}`;
  credentialBundleHash: `0x${string}`;
  policyLabel: string;
  expirySec: number;
};

// CompassPolicy mirrors enclave/src/types.ts. Trimmed to the fields the
// enclave's evaluatePolicy actually reads: predicate + minAnonymitySet +
// credentialBundleSchema + trustedIssuers + the canonicalization metadata.
function helpLegalAidPolicy(policyId: string) {
  return {
    policyId,
    issuerCanonicalName: "HELP for Domestic Workers",
    version: "1.0.0",
    predicate: {
      and: [
        { claim: "is_FDH_in_HK", equals: true },
        { claim: "has_pending_case", equals: true },
      ],
    },
    minAnonymitySet: 100,
    expectedVct: "https://compass.0g.ai/vct/help-fdh.v1",
    credentialBundleSchema: {
      required: [
        "is_FDH_in_HK",
        "has_pending_case",
        "employment_active",
        "residency",
      ],
      properties: {
        is_FDH_in_HK: { type: "boolean" },
        has_pending_case: { type: "boolean" },
        employment_active: { type: "boolean" },
        residency: { type: "string", const: "HK" },
      },
    },
    trustedIssuers: [
      "did:key:z6MkREPLACE_HELP_DID_KEY_AT_PHASE_4A",
    ],
    humanReadable: {
      title: "HELP for Domestic Workers — Free Legal Aid Eligibility",
    },
    policyHashAlgorithm: "sha256",
    policyHashCanonicalization: "RFC 8785 JSON Canonicalization Scheme",
  };
}

const HELP_FIXTURE_CLAIMS = {
  is_FDH_in_HK: true,
  has_pending_case: true,
  employment_active: true,
  residency: "HK",
} as const;

export function getEnclaveUrl(): string | null {
  const url = process.env.COMPASS_ENCLAVE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return url.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function callEnclave(
  baseUrl: string,
  inputs: EnclaveCallInputs,
): Promise<EnclaveResponseSlim> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiry = inputs.expirySec;
  if (expiry <= issuedAt) {
    throw new Error("expirySec must be in the future");
  }

  const payload = {
    receiptId: inputs.receiptId,
    challenge: inputs.challenge,
    agentIdCommitment: inputs.agentIdCommitment,
    verifierPubKey: COMPASS_VERIFIER_PUB_KEY,
    credentialBundleHash: inputs.credentialBundleHash,
    policy: helpLegalAidPolicy(inputs.policyLabel),
    policyHash: inputs.policyHash,
    claims: HELP_FIXTURE_CLAIMS,
    expiry,
    issuedAt,
  };

  // Enclave wraps the receipt in OpenAI chat-completion shape because the
  // 0G broker forwarding pattern requires it. user.content is base64'd JSON.
  const userContent = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  const reqBody = {
    model: "compass-receipt-signer",
    messages: [{ role: "user", content: userContent }],
  };

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`enclave ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const inner = json.choices?.[0]?.message?.content;
  if (!inner || typeof inner !== "string") {
    throw new Error("enclave returned no choices[0].message.content");
  }
  const parsed = JSON.parse(inner) as {
    attestationDigest?: string;
    signature?: string;
    signerAddress?: string;
    perReceiptQuoteHex?: string | null;
    receipt?: { version?: string };
  };
  if (
    !parsed.attestationDigest
    || !/^0x[0-9a-f]{64}$/i.test(parsed.attestationDigest)
  ) {
    throw new Error("enclave attestationDigest missing or malformed");
  }
  if (!parsed.signature || !parsed.signerAddress) {
    throw new Error("enclave signature or signerAddress missing");
  }
  return {
    attestationDigest: parsed.attestationDigest as `0x${string}`,
    signature: parsed.signature as `0x${string}`,
    signerAddress: parsed.signerAddress as `0x${string}`,
    perReceiptQuoteHex:
      parsed.perReceiptQuoteHex && /^0x[0-9a-fA-F]+$/.test(parsed.perReceiptQuoteHex)
        ? (parsed.perReceiptQuoteHex as `0x${string}`)
        : null,
    receiptVersion: parsed.receipt?.version ?? "unknown",
    // Source is implicit: if the enclave returned a non-null
    // perReceiptQuoteHex, the signer was sourced from a TEE; null means
    // the deployment is in env-fallback mode.
    source: parsed.perReceiptQuoteHex ? "tee" : "env",
  };
}

export async function probeEnclaveHealth(baseUrl: string): Promise<{
  ok: boolean;
  status?: number;
  signer?: string;
  source?: string;
}> {
  try {
    const res = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const j = (await res.json()) as { signer?: string; source?: string };
    return { ok: true, signer: j.signer, source: j.source };
  } catch {
    return { ok: false };
  }
}
