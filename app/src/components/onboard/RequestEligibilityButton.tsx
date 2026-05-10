"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  createWalletClient,
  custom,
  encodeAbiParameters,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { zeroGGalileoTestnet } from "@/lib/chains";
import {
  COMPASS_EIP712_DOMAIN_NAME,
  COMPASS_EIP712_DOMAIN_VERSION,
  COMPASS_GRANT_TYPES,
  COMPASS_HUB_GALILEO,
  HELP_LEGAL_AID_POLICY_LABEL,
} from "@/lib/contracts";

const GALILEO_EXPLORER_TX = "https://chainscan-galileo.0g.ai/tx";

const POLICY_ID: Hex = keccak256(toHex(HELP_LEGAL_AID_POLICY_LABEL));

type ConsumeResponse = {
  txHash: Hex;
  blockNumber: number;
  receiptId: Hex;
  policyId: Hex;
  nullifier: Hex;
  agentIdCommitment: Hex;
  resultHash: Hex;
  attestationDigest: Hex;
  timestampBucket: number;
  receiptExpiry: number;
};

type Phase = "ready" | "signing" | "submitting" | "mining" | "done" | "error";

type Props = {
  walletAddress: Address;
  agentTokenId: bigint;
  /** Public address of the server-held provider wallet — must match the key
   *  in /api/consume's PROVIDER_PRIVATE_KEY env. */
  providerAddress: Address;
  onIssued: (info: ConsumeResponse) => void;
};

// Nullifier matches the test-suite pattern in
// contracts/test/CompassHub.authwit.t.ts: keccak256(abi.encode(nonce,
// provider, policyId)). Browser-side derivation lets the user own the
// uniqueness; server only relays.
function buildNullifier(
  nonce: bigint,
  providerAddress: Address,
  policyId: Hex,
): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "uint256" }, { type: "address" }, { type: "bytes32" }],
      [nonce, providerAddress, policyId],
    ),
  );
}

export function RequestEligibilityButton({
  walletAddress,
  agentTokenId,
  providerAddress,
  onIssued,
}: Props) {
  const { wallets } = useWallets();
  const [phase, setPhase] = useState<Phase>("ready");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ConsumeResponse | null>(null);

  async function request() {
    const wallet = wallets.find((w) => w.walletClientType === "privy");
    if (!wallet) {
      setErrorMsg("Embedded wallet not ready. Reload the page.");
      setPhase("error");
      return;
    }
    setPhase("signing");
    setErrorMsg(null);

    try {
      await wallet.switchChain(zeroGGalileoTestnet.id);
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: zeroGGalileoTestnet,
        transport: custom(provider),
        account: walletAddress,
      });

      // Grant fields. Nonce + nullifier are unique per request; expiry is 1hr
      // so the user has time to pause without grant going stale.
      const nonce = BigInt(Date.now());
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 60 * 60);
      const nullifier = buildNullifier(nonce, providerAddress, POLICY_ID);

      const grantMessage = {
        agentTokenId,
        policyId: POLICY_ID,
        provider: providerAddress,
        nonce,
        expiry,
        nullifier,
      } as const;

      const sig = await walletClient.signTypedData({
        account: walletAddress,
        domain: {
          name: COMPASS_EIP712_DOMAIN_NAME,
          version: COMPASS_EIP712_DOMAIN_VERSION,
          chainId: zeroGGalileoTestnet.id,
          verifyingContract: COMPASS_HUB_GALILEO,
        },
        types: COMPASS_GRANT_TYPES,
        primaryType: "Grant",
        message: grantMessage,
      });

      setPhase("submitting");

      const res = await fetch("/api/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant: {
            agentTokenId: agentTokenId.toString(),
            policyId: POLICY_ID,
            provider: providerAddress,
            nonce: nonce.toString(),
            expiry: Number(expiry),
            nullifier,
          },
          sig,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { message?: string }).message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const data = (await res.json()) as ConsumeResponse;
      setResult(data);
      setPhase("done");
      onIssued(data);
    } catch (err) {
      console.error("[request-eligibility] failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      const userRejected = /reject|denied|cancel/i.test(msg);
      setErrorMsg(userRejected ? "Request cancelled in wallet." : msg.slice(0, 200));
      setPhase("error");
    }
  }

  if (phase === "signing") return <Pill tone="warning">awaiting signature…</Pill>;
  if (phase === "submitting") return <Pill tone="warning">submitting grant…</Pill>;
  if (phase === "mining") return <Pill tone="warning">mining receipt…</Pill>;
  if (phase === "done" && result) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Pill tone="positive">✓ receipt minted</Pill>
        <a
          href={`${GALILEO_EXPLORER_TX}/${result.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
        >
          {result.txHash.slice(0, 14)}…{result.txHash.slice(-6)} ↗
        </a>
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
          bucket {result.timestampBucket}
        </p>
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => request()}
          className="rounded-full border border-amber-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-amber-400/80 uppercase transition-colors hover:border-amber-400/60"
        >
          Retry
        </button>
        {errorMsg ? (
          <p className="max-w-[18rem] text-right font-mono text-[10px] tracking-[0.2em] text-amber-400/60 uppercase">
            {errorMsg}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => request()}
      className="rounded-full border border-foreground/40 bg-foreground/5 px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase transition-colors hover:bg-foreground/10"
    >
      Request HELP eligibility (live) →
    </button>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "neutral" | "positive" | "warning";
  children: React.ReactNode;
}) {
  const cls =
    tone === "positive"
      ? "border-green-400/30 text-green-400/80"
      : tone === "warning"
        ? "border-amber-400/30 text-amber-400/80"
        : "border-border/40 text-muted-foreground/60";
  return (
    <span
      className={`rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.3em] uppercase ${cls}`}
    >
      {children}
    </span>
  );
}
