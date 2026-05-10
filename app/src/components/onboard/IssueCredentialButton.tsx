"use client";

import { useState } from "react";
import type { Address } from "viem";

const HELP_VCT = "https://compass.0g.ai/vct/help-fdh.v1";
const HELP_CLAIMS = {
  is_FDH_in_HK: true,
  has_pending_case: true,
  employment_active: true,
  residency: "HK",
};

export type IssueResponse = {
  sdjwtvc: string;
  issuerDid: string;
  vct: string;
  claimNames: string[];
  issuedAt: number;
  expiresAt: number;
};

type Phase = "ready" | "signing" | "done" | "error";

type Props = {
  walletAddress: Address;
  onIssued: (info: IssueResponse) => void;
};

export function IssueCredentialButton({ walletAddress, onIssued }: Props) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function issue() {
    setPhase("signing");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vct: HELP_VCT,
          claims: HELP_CLAIMS,
          holderAddress: walletAddress,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { message?: string }).message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const data = (await res.json()) as IssueResponse;
      if (!data.sdjwtvc) throw new Error("missing sdjwtvc in response");
      setPhase("done");
      onIssued(data);
    } catch (err) {
      console.error("[issue] failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg.slice(0, 160));
      setPhase("error");
    }
  }

  if (phase === "signing") {
    return (
      <span className="rounded-full border border-amber-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-amber-400/80 uppercase">
        signing…
      </span>
    );
  }

  if (phase === "done") {
    return (
      <span className="rounded-full border border-green-400/30 px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-green-400/80 uppercase">
        ✓ issued
      </span>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => issue()}
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
      onClick={() => issue()}
      className="rounded-full border border-border px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-foreground uppercase transition-colors hover:border-foreground/40"
    >
      Issue
    </button>
  );
}
