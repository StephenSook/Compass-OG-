"use client";

import Link from "next/link";
import { useState } from "react";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import {
  parseBundle,
  verifyBundle,
  type VerifyResult,
} from "@/lib/verifyReceipt";

// Canonical Phala dstack composeHash pinned in this repo's deployment
// evidence (docs/notes/phala-deployment.md). Visitors can swap if
// they're verifying a bundle from a different deployment.
const DEFAULT_COMPOSE_HASH =
  "0x1884e756bba03fc75f8354a04b294372c770a2720a10b7b3c6cd970a42bdcea0";

// Compose hash used by the bundled fixture sample. Matches the value
// pinned in enclave/scripts/mint-sample-receipt.ts (0xab repeated 32
// times). The sample is a test vector — it MUST NOT use the production
// composeHash because the test signer is not the production signer and
// using prod-anchored test bundles would let a malicious actor produce
// "valid-looking" fake receipts.
const SAMPLE_COMPOSE_HASH = "0x" + "ab".repeat(32);

const SAMPLE_BUNDLE_URL = "/samples/receipt-sample.json";

// Cap dropped/picked files at 1 MB. A Compass receipt bundle is ~2 KB;
// 1 MB is 500× headroom and prevents an accidental huge JSON paste from
// freezing the tab inside FileReader.readAsText.
const MAX_BUNDLE_BYTES = 1_048_576;

// 32-byte 0x-hex regex for composeHash + receipt-id shape validation.
const HEX32 = /^0x[0-9a-fA-F]{64}$/;

type Phase = "idle" | "loading-sample" | "verifying" | "done";

export default function VerifyPage() {
  const [bundleText, setBundleText] = useState("");
  const [composeHash, setComposeHash] = useState(DEFAULT_COMPOSE_HASH);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  // Track whether composeHash was last auto-filled from "Try sample".
  // If yes, a subsequent manual edit to the bundle text resets the
  // composeHash to the production default — prevents a "stale fixture
  // composeHash falsely fails a real receipt" trap.
  const [composeFromSample, setComposeFromSample] = useState(false);

  async function loadSample() {
    setPhase("loading-sample");
    setError(null);
    try {
      const res = await fetch(SAMPLE_BUNDLE_URL);
      if (!res.ok) throw new Error(`fetch ${SAMPLE_BUNDLE_URL} → HTTP ${res.status}`);
      const text = await res.text();
      setBundleText(text);
      // Sample is a test fixture pinned to a non-prod composeHash; swap
      // both fields together so the first-click demo path lands green.
      // composeFromSample flips so a later manual receipt edit can reset
      // composeHash back to the production default.
      setComposeHash(SAMPLE_COMPOSE_HASH);
      setComposeFromSample(true);
      setResult(null);
      setPhase("idle");
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }

  function onBundleEdit(next: string) {
    setBundleText(next);
    // Manually editing the bundle after a Try-sample run means the
    // visitor is verifying a different (probably real) receipt;
    // restore the production composeHash so they don't get a stale-
    // fixture false negative on Step 4.
    if (composeFromSample) {
      setComposeHash(DEFAULT_COMPOSE_HASH);
      setComposeFromSample(false);
    }
  }

  function onComposeEdit(next: string) {
    setComposeHash(next.trim());
    setComposeFromSample(false);
  }

  function runVerify() {
    setError(null);
    setResult(null);
    if (!HEX32.test(composeHash)) {
      setError(
        `composeHash must be 32-byte 0x-hex (64 hex chars after 0x). Got "${composeHash.slice(0, 12)}…" (${composeHash.length} chars).`,
      );
      return;
    }
    setPhase("verifying");
    try {
      const bundle = parseBundle(bundleText);
      const r = verifyBundle({ bundle, expectedComposeHash: composeHash });
      setResult(r);
      setPhase("done");
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }

  function handleFile(file: File) {
    if (file.size > MAX_BUNDLE_BYTES) {
      setError(
        `file too large: ${file.size} bytes (max ${MAX_BUNDLE_BYTES}). A Compass receipt bundle is ~2 KB; refusing to read multi-MB inputs to avoid freezing the tab.`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onBundleEdit(String(reader.result ?? ""));
    };
    reader.onerror = () => {
      // Surface FileReader.error details rather than a generic message —
      // disk error vs permission denied vs file-deleted-during-read all
      // need different fixes (silent-failure-hunter 2026-05-11).
      const e = reader.error;
      setError(`could not read file: ${e?.name ?? "unknown"} ${e?.message ?? ""}`.trim());
    };
    reader.readAsText(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <LiquidGlass radius="full" className="px-6 py-2">
          <Link
            href="/"
            className="font-mono text-xs tracking-[0.3em] text-foreground uppercase"
          >
            ← COMPASS
          </Link>
        </LiquidGlass>
      </header>

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Verify a receipt
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            Don&apos;t trust us. <span className="font-serif italic">Re-derive it.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Drop a Compass receipt bundle (JSON) below. Your browser re-runs the
            same four cryptographic checks the{" "}
            <code className="font-mono text-sm text-foreground/80">
              verify-receipt
            </code>{" "}
            CLI does — no server calls, nothing leaves the page. The same
            evidence that backs the on-chain audit log.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-3">
              <label
                htmlFor="bundle-input"
                className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase"
              >
                Receipt bundle JSON
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-3 transition-colors hover:border-foreground/40"
              >
                <textarea
                  id="bundle-input"
                  value={bundleText}
                  onChange={(e) => onBundleEdit(e.target.value)}
                  placeholder='{"receipt": {...}, "attestationDigest": "0x...", "signature": "0x...", "signerAddress": "0x...", "perReceiptQuoteHex": "0x..."}'
                  className="h-72 w-full resize-y rounded-lg border border-border/40 bg-background/60 p-4 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <label className="cursor-pointer rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] tracking-[0.3em] uppercase transition-colors hover:border-foreground/40 hover:text-foreground">
                    Choose file
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={loadSample}
                    disabled={phase === "loading-sample"}
                    className="rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] tracking-[0.3em] uppercase transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
                  >
                    {phase === "loading-sample" ? "Loading…" : "Try sample"}
                  </button>
                  <span className="text-[10px] text-muted-foreground/60">
                    or drag-drop a .json file
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="compose-input"
                className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase"
              >
                Expected composeHash
              </label>
              <input
                id="compose-input"
                value={composeHash}
                onChange={(e) => onComposeEdit(e.target.value)}
                className="rounded-lg border border-border/40 bg-background/60 p-3 font-mono text-xs text-foreground focus:border-foreground/40 focus:outline-none"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Out-of-band trust anchor. Defaults to Compass&apos; live Phala
                dstack TDX image. <strong>Try sample</strong> swaps this to the
                test-fixture composeHash so the bundled sample verifies
                cleanly; reset to the default when verifying a real receipt.
              </p>

              <button
                type="button"
                onClick={runVerify}
                disabled={!bundleText.trim()}
                className="mt-4 rounded-full border border-foreground/40 bg-foreground/5 px-6 py-3 font-mono text-xs tracking-[0.3em] text-foreground uppercase transition-colors hover:bg-foreground/10 disabled:opacity-40"
              >
                {phase === "verifying" ? "Verifying…" : "Verify receipt →"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-8 rounded-2xl border border-rose-400/40 bg-rose-400/5 p-4 text-sm text-rose-200">
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase">
                Parse error
              </span>
              <p className="mt-2 font-mono text-xs">{error}</p>
            </div>
          ) : null}

          {result ? (
            <div className="mt-12">
              <div
                className={`flex items-center gap-3 rounded-2xl border p-6 ${
                  result.ok
                    ? "border-emerald-400/40 bg-emerald-400/5"
                    : "border-rose-400/40 bg-rose-400/5"
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                    result.ok
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-rose-400/15 text-rose-300"
                  }`}
                  aria-hidden="true"
                >
                  {result.ok ? "✓" : "✗"}
                </span>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                    {result.ok ? "Verification passed" : "Verification failed"}
                  </p>
                  <h2 className="mt-1 text-xl text-foreground md:text-2xl">
                    {result.ok ? (
                      <>
                        Receipt is{" "}
                        <span className="font-serif italic">authentic</span>.
                      </>
                    ) : (
                      <>
                        Receipt did <span className="font-serif italic">not</span>{" "}
                        verify.
                      </>
                    )}
                  </h2>
                </div>
              </div>

              <ol className="mt-8 space-y-4">
                {result.steps.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-border/40 bg-card/30 p-4"
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        className={`font-mono text-sm ${
                          s.ok ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {s.ok ? "✓" : "✗"}
                      </span>
                      <span className="font-mono text-xs text-foreground/80">
                        {String(i + 1).padStart(2, "0")} · {s.label}
                      </span>
                    </div>
                    {s.detail ? (
                      <p className="mt-2 ml-7 font-mono text-[11px] break-all text-muted-foreground">
                        {s.detail}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>

              {result.ok ? (
                <div className="mt-8 rounded-2xl border border-border/40 bg-card/30 p-6 text-sm text-muted-foreground">
                  <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                    What this receipt says
                  </p>
                  <dl className="mt-4 grid gap-3 md:grid-cols-2">
                    <Row label="receiptId" value={result.receipt.receiptId} mono />
                    <Row label="policyId" value={result.receipt.result.policyId} />
                    <Row
                      label="result"
                      value={`${result.receipt.result.eligible ? "eligible" : "denied"} — ${result.receipt.result.reason}`}
                    />
                    <Row label="signerAddress" value={result.signerAddress} mono />
                    <Row
                      label="issuedAt"
                      value={new Date(result.receipt.issuedAt * 1000).toISOString()}
                    />
                    <Row
                      label="expiry"
                      value={new Date(result.receipt.expiry * 1000).toISOString()}
                    />
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-20 rounded-2xl border border-border/40 bg-card/30 p-6 text-sm text-muted-foreground">
            <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              What this verifier checks
            </h2>
            <ol className="mt-4 space-y-2 text-base">
              <li>
                <span className="font-mono text-xs text-foreground/70">01</span>{" "}
                <code className="font-mono text-xs">
                  attestationDigest = sha256(canonicalize(receipt))
                </code>
              </li>
              <li>
                <span className="font-mono text-xs text-foreground/70">02</span>{" "}
                <code className="font-mono text-xs">
                  ECDSA.recover(attestationDigest, signature) == signerAddress
                </code>
              </li>
              <li>
                <span className="font-mono text-xs text-foreground/70">03</span>{" "}
                <code className="font-mono text-xs">
                  receipt.quoteCommitment = sha256(perReceiptQuoteHex)
                </code>
              </li>
              <li>
                <span className="font-mono text-xs text-foreground/70">04</span>{" "}
                <code className="font-mono text-xs">
                  extractReportData(quote)[0:32] = sha256(signer || composeHash || receiptId)
                </code>
              </li>
            </ol>
            <p className="mt-4">
              Out of scope: Intel DCAP signature-chain verification on the TDX
              quote itself (use DStack Verifier or Intel QVL externally), and
              dstack <code className="font-mono text-xs">signature_chain</code>{" "}
              validation on the key derivation. Same posture as the Node
              CLI at{" "}
              <a
                href="https://github.com/StephenSook/Compass-OG-/blob/main/enclave/scripts/verify-receipt.ts"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                enclave/scripts/verify-receipt.ts
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        {label}
      </dt>
      <dd className={`mt-1 break-all ${mono ? "font-mono text-xs" : "text-sm"}`}>
        {value}
      </dd>
    </div>
  );
}
