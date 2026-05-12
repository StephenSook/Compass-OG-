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

// Placeholder for the calling verifier's secp256k1 public key. The
// enclave's validateCompassPayload only checks `^0x[0-9a-fA-F]+$`, so
// the field shape is permissive — but the receipt-doc commits to this
// value via the canonical sha256 attestationDigest. v2 wires the real
// clinic key here; v1 uses a stable 65-byte uncompressed-pubkey-shaped
// stub so the canonical commitment is at least non-malformed and
// stable across receipts. See docs/honest-limits.md item 16.
const COMPASS_VERIFIER_PUB_KEY =
  "0x040000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002";

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
  const raw = process.env.COMPASS_ENCLAVE_URL;
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      // silent-failure-hunter 2026-05-11: prior versions returned null
      // silently on malformed URLs, which bypassed /api/consume's
      // fail-closed guard and silently minted stub-digest receipts on
      // mainnet. Now we log + return null so the operator sees the
      // misconfiguration; /api/consume then refuses to mint in
      // production (see the production-gate check there).
      console.error(
        "[enclave] COMPASS_ENCLAVE_URL has unsupported protocol, treating as unset:",
        parsed.protocol,
      );
      return null;
    }
    return raw.replace(/\/$/, "");
  } catch {
    console.error(
      "[enclave] COMPASS_ENCLAVE_URL is not a valid URL, treating as unset:",
      raw.slice(0, 40),
    );
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
    source?: string;
    receipt?: { version?: string };
  };
  if (
    !parsed.attestationDigest
    || !/^0x[0-9a-f]{64}$/i.test(parsed.attestationDigest)
  ) {
    throw new Error("enclave attestationDigest missing or malformed");
  }
  // OWASP API10 (LOW): shape-validate signature + signerAddress from
  // the enclave response. The enclave is trusted infrastructure but
  // defense-in-depth — a future Phala bug surfacing garbage strings
  // would otherwise propagate to the caller's response body without
  // notice. attestationDigest is already validated above.
  //
  // The enclave's signReceipt uses `@noble/curves` v2 `secp256k1.sign()`
  // which returns a 64-byte compact signature (r || s, no recovery
  // byte) = 128 hex chars. The verifier-side reconstructs recovery by
  // trying both v=0 and v=1 (see verifyReceipt.ts `sigBytes.length ===
  // 64` pre-check + ECDSA-recover step). Earlier the regex demanded
  // 130 chars (Ethereum r||s||v); that was the wrong invariant and
  // every /api/consume call 503'd against it.
  if (!parsed.signature || !/^0x[0-9a-fA-F]{128}$/.test(parsed.signature)) {
    throw new Error("enclave signature missing or not 64-byte compact 0x-hex (r||s)");
  }
  if (!parsed.signerAddress || !/^0x[0-9a-fA-F]{40}$/.test(parsed.signerAddress)) {
    throw new Error("enclave signerAddress missing or not 20-byte 0x-hex");
  }
  // Parse + validate perReceiptQuoteHex separately so we can be
  // explicit about regex failure vs absence.
  //
  // The enclave's `requestPerReceiptQuote` returns `quoteHex` straight
  // from `@phala/dstack-sdk` `client.getQuote()` — which emits raw hex
  // WITHOUT the `0x` prefix. Normalize on this side so the downstream
  // `0x${string}` typed value is uniform. Prior version required the
  // prefix and 503'd every legitimate quote — that bug landed via the
  // Wave-2 OWASP hardening commit (f3dc918) alongside the 64-byte
  // signature regex bug (fixed in commit 0cb941e).
  let perReceiptQuoteHex: `0x${string}` | null = null;
  if (parsed.perReceiptQuoteHex) {
    const raw = parsed.perReceiptQuoteHex;
    const normalized = raw.startsWith("0x") || raw.startsWith("0X")
      ? raw
      : "0x" + raw;
    if (!/^0x[0-9a-fA-F]+$/.test(normalized)) {
      // silent-failure-hunter 2026-05-11: prior version silently
      // downgraded source to "env" when this regex failed, masking a
      // client-side parse bug as a TEE failure. Now throw so the caller
      // (/api/consume's fail-closed guard) gets a clear signal.
      throw new Error(
        "enclave perReceiptQuoteHex present but malformed: " +
          raw.slice(0, 40),
      );
    }
    perReceiptQuoteHex = normalized as `0x${string}`;
  }
  // Prefer the enclave's explicit `source` field when present; only
  // fall back to truthiness-inference for older enclave images that
  // predated the explicit field. silent-failure-hunter 2026-05-11.
  const source: "tee" | "env" =
    parsed.source === "tee" || parsed.source === "env"
      ? parsed.source
      : perReceiptQuoteHex
        ? "tee"
        : "env";
  return {
    attestationDigest: parsed.attestationDigest as `0x${string}`,
    signature: parsed.signature as `0x${string}`,
    signerAddress: parsed.signerAddress as `0x${string}`,
    perReceiptQuoteHex,
    receiptVersion: parsed.receipt?.version ?? "unknown",
    source,
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
