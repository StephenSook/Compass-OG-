import Link from "next/link";
import { notFound } from "next/navigation";
import { TEEBadge } from "@/components/primitives/TEEBadge";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import { MagneticButton } from "@/components/primitives/MagneticButton";
import {
  RECEIPTS,
  formatExpiry,
  shortenHex,
} from "@/lib/fixtures/receipts";

export function generateStaticParams() {
  return Object.keys(RECEIPTS).map((id) => ({ id }));
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = RECEIPTS[id];
  if (!r) notFound();

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="px-6 pt-10 pb-6">
        <Link
          href="/"
          className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          ← Compass
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center px-6 pb-20">
        <div className="w-full max-w-3xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Receipt #{id}
          </p>
          <h1 className="mt-4 text-3xl leading-tight font-medium text-foreground md:text-5xl">
            {r.eligible ? (
              <>
                <span className="font-serif italic">Eligible</span> for {r.policyName}
              </>
            ) : (
              <>Not eligible for {r.policyName}</>
            )}
          </h1>
          <div className="mt-6">
            <TEEBadge status="verified" />
          </div>

          <LiquidGlass radius="xl" className="mt-12 p-8">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
              On-chain receipt fields
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="receiptId" value={shortenHex(r.receiptId)} mono />
              <Field label="policyId" value={r.policyId} mono />
              <Field label="result" value={r.eligible ? "true" : "false"} />
              <Field label="resultHash" value={shortenHex(r.resultHash)} mono />
              <Field label="nullifier" value={shortenHex(r.nullifier)} mono />
              <Field label="agentIdCommitment" value={shortenHex(r.agentIdCommitment)} mono />
              <Field label="attestationDigest" value={shortenHex(r.attestationDigest)} mono />
              <Field label="expiry" value={formatExpiry(r.expirySec)} mono />
            </dl>
          </LiquidGlass>

          <p className="mt-12 font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Cryptographic chain
          </p>
          <ol className="mt-6 space-y-5 text-sm text-muted-foreground md:text-base">
            <Step
              n={1}
              title="Encrypted vault on 0G Storage"
              detail={`AES-256-GCM ciphertext, root ${shortenHex(r.storageRootHash, 8, 6)}`}
            />
            <Step
              n={2}
              title="TEE-attested policy evaluation"
              detail={`dstack TDX provider ${shortenHex(r.teeProvider, 8, 6)} · signer ${shortenHex(r.teeSignerAddress, 8, 6)} bound into report_data`}
            />
            <Step
              n={3}
              title="Receipt signed inside the enclave"
              detail={`attestationDigest ${shortenHex(r.attestationDigest, 8, 6)}`}
            />
            <Step
              n={4}
              title="ReceiptIssued emitted on Galileo"
              detail={`mint tx ${shortenHex(r.mintTxHash, 8, 6)} · timestamp bucketed to 15-min`}
            />
          </ol>

          <div className="mt-16 flex flex-wrap justify-center gap-4">
            <MagneticButton
              href={`https://chainscan-galileo.0g.ai/tx/${r.mintTxHash}`}
              ariaLabel="Verify receipt transaction on chainscan-galileo (opens new tab)"
              className="liquid-glass-border bg-white/[0.02] backdrop-blur-md backdrop-saturate-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase"
            >
              Verify on chain →
            </MagneticButton>
            <MagneticButton
              href={`https://storagescan-galileo.0g.ai/tx/${r.storageRootHash}`}
              ariaLabel="Inspect encrypted vault on 0G storage explorer (opens new tab)"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Inspect 0G Storage →
            </MagneticButton>
            <Link
              href="/clinic/subpoena"
              className="self-center font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              See disclosure log →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {label}
      </dt>
      <dd className={`mt-1 ${mono ? "font-mono" : ""} text-sm text-foreground`}>{value}</dd>
    </div>
  );
}

function Step({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <li className="flex gap-4">
      <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground/40">
        0{n}
      </span>
      <div>
        <p className="text-foreground">{title}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground/70">{detail}</p>
      </div>
    </li>
  );
}
