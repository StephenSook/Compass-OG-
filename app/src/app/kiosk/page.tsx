"use client";

import { useCallback, useState } from "react";
import type { Address, Hex } from "viem";
import { PrivyConnectButton } from "@/components/onboard/PrivyConnectButton";
import { MintAgentButton } from "@/components/onboard/MintAgentButton";
import {
  IssueCredentialButton,
  type IssueResponse,
} from "@/components/onboard/IssueCredentialButton";
import { RequestEligibilityButton } from "@/components/onboard/RequestEligibilityButton";
import {
  encryptText,
  getOrCreateVaultKey,
  type StoredLiveCredential,
} from "@/lib/crypto/vault";
import { isPrivyEnabled } from "@/lib/chains";
import {
  LOCALE_LABELS,
  LOCALE_ORDER,
  getKioskStrings,
  type Locale,
} from "@/lib/i18n/kiosk-strings";

const LIVE_CREDENTIAL_STORAGE_KEY = "compass.live_credentials";

const COMPASS_PROVIDER_ADDRESS = process.env
  .NEXT_PUBLIC_COMPASS_PROVIDER_ADDRESS as `0x${string}` | undefined;

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

type Phase = "welcome" | "active" | "done";

export default function KioskPage() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [locale, setLocale] = useState<Locale>("en");
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [liveMint, setLiveMint] = useState<{ tokenId: bigint; txHash: Hex } | null>(null);
  const [liveCredential, setLiveCredential] = useState<StoredLiveCredential | null>(null);
  const [receipt, setReceipt] = useState<ConsumeResponse | null>(null);

  const privyOn = isPrivyEnabled();
  const t = getKioskStrings(locale);

  const handlePrivyConnected = useCallback((address: Address) => {
    setWalletAddress(address);
  }, []);

  const handleMinted = useCallback((info: { tokenId: bigint; txHash: Hex }) => {
    setLiveMint(info);
  }, []);

  const handleIssued = useCallback(async (info: IssueResponse) => {
    if (typeof window === "undefined") return;
    const key = await getOrCreateVaultKey();
    const enc = await encryptText(info.sdjwtvc, key);
    const stored: StoredLiveCredential = {
      schema: "compass.live_credential.v2",
      ciphertext: enc.ciphertext,
      iv: enc.iv,
      algorithm: "AES-256-GCM",
      keySource: "indexeddb-random-256",
      bytesEncrypted: enc.bytesEncrypted,
      encryptedAt: Math.floor(Date.now() / 1000),
      issuerDid: info.issuerDid,
      vct: info.vct,
      claimNames: info.claimNames,
      issuedAt: info.issuedAt,
      expiresAt: info.expiresAt,
    };
    try {
      const raw = window.localStorage.getItem(LIVE_CREDENTIAL_STORAGE_KEY);
      const arr: StoredLiveCredential[] = raw
        ? (JSON.parse(raw) as StoredLiveCredential[])
        : [];
      arr.push(stored);
      window.localStorage.setItem(LIVE_CREDENTIAL_STORAGE_KEY, JSON.stringify(arr));
    } catch (err) {
      console.warn("[kiosk] localStorage persist failed", err);
    }
    setLiveCredential(stored);
  }, []);

  const handleReceipt = useCallback((info: ConsumeResponse) => {
    setReceipt(info);
    setPhase("done");
  }, []);

  const reset = useCallback(() => {
    // Visitor walks away. Wipe localStorage of any live credentials so the
    // next person who walks up doesn't see prior receipts. The on-chain
    // events are permanent — that's intentional; receipts are auditable.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LIVE_CREDENTIAL_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    setPhase("welcome");
    setWalletAddress(null);
    setLiveMint(null);
    setLiveCredential(null);
    setReceipt(null);
  }, []);

  if (phase === "welcome") {
    return (
      <WelcomeScreen
        t={t}
        locale={locale}
        onSetLocale={setLocale}
        onStart={() => setPhase("active")}
      />
    );
  }

  if (phase === "done" && receipt) {
    return <ReceiptScreen t={t} receipt={receipt} onReset={reset} />;
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <p className="font-mono text-sm tracking-[0.3em] text-muted-foreground uppercase">
          {t.flowKicker}
        </p>
        <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-5xl">
          {t.flowTitle}{" "}
          <span className="font-serif italic">{t.flowTitleItalic}</span>
        </h1>

        <ol className="mt-10 space-y-4">
          <KioskStep
            n={1}
            title={t.step1Title}
            detail={t.step1Detail}
            doneLabel={t.stepDone}
            done={!!walletAddress}
            child={
              privyOn && !walletAddress ? (
                <PrivyConnectButton onConnected={handlePrivyConnected} />
              ) : null
            }
          />
          <KioskStep
            n={2}
            title={t.step2Title}
            detail={t.step2Detail}
            doneLabel={t.stepDone}
            disabled={!walletAddress}
            done={!!liveMint}
            child={
              walletAddress && !liveMint ? (
                <MintAgentButton walletAddress={walletAddress} onMinted={handleMinted} />
              ) : null
            }
          />
          <KioskStep
            n={3}
            title={t.step3Title}
            detail={t.step3Detail}
            doneLabel={t.stepDone}
            disabled={!liveMint}
            done={!!liveCredential}
            child={
              walletAddress && liveMint && !liveCredential ? (
                <IssueCredentialButton
                  walletAddress={walletAddress}
                  onIssued={handleIssued}
                />
              ) : null
            }
          />
          <KioskStep
            n={4}
            title={t.step4Title}
            detail={t.step4Detail}
            doneLabel={t.stepDone}
            disabled={!liveCredential}
            done={false}
            child={
              walletAddress && liveMint && liveCredential && COMPASS_PROVIDER_ADDRESS ? (
                <RequestEligibilityButton
                  walletAddress={walletAddress}
                  agentTokenId={liveMint.tokenId}
                  providerAddress={COMPASS_PROVIDER_ADDRESS}
                  onIssued={handleReceipt}
                />
              ) : null
            }
          />
        </ol>

        <button
          type="button"
          onClick={reset}
          className="mt-12 font-mono text-sm tracking-[0.3em] text-muted-foreground/60 uppercase transition-colors hover:text-foreground"
        >
          {t.cancelOver}
        </button>
      </div>
    </section>
  );
}

function WelcomeScreen({
  t,
  locale,
  onSetLocale,
  onStart,
}: {
  t: ReturnType<typeof getKioskStrings>;
  locale: Locale;
  onSetLocale: (l: Locale) => void;
  onStart: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-12 flex flex-wrap justify-center gap-3">
        {LOCALE_ORDER.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onSetLocale(l)}
            className={`rounded-full border px-5 py-3 font-mono text-sm tracking-[0.2em] uppercase transition-colors ${
              locale === l
                ? "border-foreground bg-foreground/10 text-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>
      <p className="font-mono text-sm tracking-[0.3em] text-muted-foreground uppercase">
        {t.welcomeKicker}
      </p>
      <h1 className="mt-6 max-w-3xl text-5xl leading-tight font-medium text-foreground md:text-7xl">
        {t.welcomeTitleA} <br />
        <span className="font-serif italic">{t.welcomeTitleB}</span>
      </h1>
      <p className="mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
        {t.welcomeBody}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-16 rounded-full border-2 border-foreground/60 bg-foreground/5 px-16 py-8 font-mono text-lg tracking-[0.3em] text-foreground uppercase transition-colors hover:bg-foreground/10 active:bg-foreground/15"
      >
        {t.welcomeCTA}
      </button>
      <p className="mt-12 max-w-md text-sm text-muted-foreground/60">
        {t.welcomeFooter}
      </p>
    </section>
  );
}

function ReceiptScreen({
  t,
  receipt,
  onReset,
}: {
  t: ReturnType<typeof getKioskStrings>;
  receipt: ConsumeResponse;
  onReset: () => void;
}) {
  const bucketTime = new Date(receipt.timestampBucket * 1000);
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <p className="font-mono text-sm tracking-[0.3em] text-green-400/80 uppercase">
        {t.doneStatus}
      </p>
      <h1 className="mt-6 max-w-3xl text-5xl leading-tight font-medium text-foreground md:text-7xl">
        {t.doneTitleA}{" "}
        <span className="font-serif italic">{t.doneTitleItalic}</span>
        {t.doneTitleB}
      </h1>

      <div className="mt-16 w-full max-w-xl rounded-3xl border-2 border-foreground/30 bg-foreground/5 px-8 py-12">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground/60 uppercase">
          {t.doneReceiptLabel}
        </p>
        <p className="mt-4 font-mono text-2xl text-foreground md:text-3xl">
          {bucketTime.toLocaleDateString()} ·{" "}
          {bucketTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="mt-6 font-mono text-xs tracking-[0.3em] text-muted-foreground/60 uppercase">
          {t.doneReceiptIdLabel}
        </p>
        <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
          {receipt.receiptId.slice(0, 10)}…{receipt.receiptId.slice(-8)}
        </p>
      </div>

      <p className="mt-12 max-w-xl text-base text-muted-foreground md:text-lg">
        {t.doneBody}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-16 rounded-full border-2 border-foreground/30 px-12 py-6 font-mono text-base tracking-[0.3em] text-foreground uppercase transition-colors hover:bg-foreground/5"
      >
        {t.doneReset}
      </button>
    </section>
  );
}

function KioskStep({
  n,
  title,
  detail,
  doneLabel,
  disabled,
  done,
  child,
}: {
  n: number;
  title: string;
  detail: string;
  doneLabel: string;
  disabled?: boolean;
  done: boolean;
  child: React.ReactNode;
}) {
  const opacity = disabled ? "opacity-30" : "opacity-100";
  return (
    <li
      className={`rounded-3xl border-2 p-8 transition-colors ${
        done ? "border-green-400/40" : "border-foreground/20"
      } ${opacity}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-baseline gap-6">
          <span className="font-mono text-3xl text-muted-foreground/40">0{n}</span>
          <div>
            <h2 className="text-2xl text-foreground md:text-3xl">{title}</h2>
            <p className="mt-3 max-w-lg text-base text-muted-foreground md:text-lg">
              {detail}
            </p>
          </div>
        </div>
        {done ? (
          <span className="rounded-full border-2 border-green-400/40 px-6 py-3 font-mono text-sm tracking-[0.3em] text-green-400/80 uppercase">
            {doneLabel}
          </span>
        ) : (
          child
        )}
      </div>
    </li>
  );
}
