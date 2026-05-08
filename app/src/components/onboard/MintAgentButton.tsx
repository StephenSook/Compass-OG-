"use client";

import { useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { zeroGGalileoTestnet } from "@/lib/chains";
import {
  AGENT_REGISTRY_ABI,
  AGENT_REGISTRY_GALILEO,
} from "@/lib/contracts";

const GALILEO_FAUCET_URL = "https://faucet.0g.ai/";
const GALILEO_EXPLORER_TX = "https://chainscan-galileo.0g.ai/tx";

// Fixture metadata for the demo mint. AgentRegistry rejects a zero
// metadataHash, so we hash a stable label so judges can re-derive it.
const DEMO_METADATA_HASH: Hex = keccak256(
  toHex("compass:demo:agent-mint-v1"),
);
const DEMO_ENCRYPTED_URI = "";
const DEMO_ATTESTOR: Address = "0x0000000000000000000000000000000000000000";
const DEMO_TRUST_LIST_ROOT: Hex =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const publicClient = createPublicClient({
  chain: zeroGGalileoTestnet,
  transport: http(),
});

type Phase = "loading" | "needs-fund" | "ready" | "signing" | "mining" | "done" | "error";

type Props = {
  walletAddress: Address;
  onMinted: (info: { tokenId: bigint; txHash: Hex }) => void;
};

export function MintAgentButton({ walletAddress, onMinted }: Props) {
  const { wallets } = useWallets();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);

  // Balance probe runs on mount + every retry click. Privy provisions the
  // embedded wallet with 0 OG; we surface the faucet link if balance===0.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const balance = await publicClient.getBalance({ address: walletAddress });
        if (cancelled) return;
        setPhase(balance === BigInt(0) ? "needs-fund" : "ready");
      } catch (err) {
        if (cancelled) return;
        console.error("[mint] balance probe failed", err);
        setErrorMsg("Could not read Galileo balance. Network may be down.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  async function refreshBalance() {
    setPhase("loading");
    setErrorMsg(null);
    try {
      const balance = await publicClient.getBalance({ address: walletAddress });
      setPhase(balance === BigInt(0) ? "needs-fund" : "ready");
    } catch (err) {
      console.error("[mint] balance probe failed", err);
      setErrorMsg("Could not read Galileo balance. Network may be down.");
      setPhase("error");
    }
  }

  async function mint() {
    const wallet = wallets.find((w) => w.walletClientType === "privy");
    if (!wallet) {
      setErrorMsg("Embedded wallet not ready. Reload the page.");
      setPhase("error");
      return;
    }
    try {
      setPhase("signing");
      setErrorMsg(null);
      await wallet.switchChain(zeroGGalileoTestnet.id);
      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: zeroGGalileoTestnet,
        transport: custom(provider),
        account: walletAddress,
      });

      const hash = await walletClient.writeContract({
        address: AGENT_REGISTRY_GALILEO,
        abi: AGENT_REGISTRY_ABI,
        functionName: "mintAgent",
        args: [
          DEMO_METADATA_HASH,
          DEMO_ENCRYPTED_URI,
          DEMO_ATTESTOR,
          DEMO_TRUST_LIST_ROOT,
        ],
      });
      setTxHash(hash);
      setPhase("mining");

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") {
        throw new Error(`Tx reverted: ${hash}`);
      }
      const mintedLog = receipt.logs.find(
        (l) => l.address.toLowerCase() === AGENT_REGISTRY_GALILEO.toLowerCase(),
      );
      if (!mintedLog) throw new Error("AgentMinted event missing in receipt");
      const decoded = decodeEventLog({
        abi: AGENT_REGISTRY_ABI,
        data: mintedLog.data,
        topics: mintedLog.topics,
      });
      if (decoded.eventName !== "AgentMinted") {
        throw new Error(`Unexpected event: ${decoded.eventName}`);
      }
      const tokenId = decoded.args.tokenId;
      setPhase("done");
      onMinted({ tokenId, txHash: hash });
    } catch (err) {
      console.error("[mint] tx failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      // viem surfaces user-rejection as a recognizable string.
      const userRejected = /reject|denied|cancel/i.test(msg);
      setErrorMsg(userRejected ? "Mint cancelled in wallet." : msg.slice(0, 160));
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return <Pill tone="neutral">checking balance…</Pill>;
  }

  if (phase === "needs-fund") {
    return (
      <div className="flex flex-col items-end gap-2">
        <a
          href={GALILEO_FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-amber-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-amber-400/80 uppercase transition-colors hover:border-amber-400/60"
        >
          Fund on Galileo →
        </a>
        <button
          type="button"
          onClick={refreshBalance}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
        >
          Recheck balance
        </button>
      </div>
    );
  }

  if (phase === "signing") {
    return <Pill tone="warning">awaiting signature…</Pill>;
  }

  if (phase === "mining") {
    return (
      <div className="flex flex-col items-end gap-2">
        <Pill tone="warning">mining…</Pill>
        {txHash ? (
          <a
            href={`${GALILEO_EXPLORER_TX}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-6)} ↗
          </a>
        ) : null}
      </div>
    );
  }

  if (phase === "done") {
    return <Pill tone="positive">✓ minted</Pill>;
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => mint()}
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
      onClick={() => mint()}
      className="rounded-full border border-border px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-foreground uppercase transition-colors hover:border-foreground/40"
    >
      Mint
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
