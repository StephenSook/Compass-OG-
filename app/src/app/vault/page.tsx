import Link from "next/link";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { Stat } from "@/components/primitives/Stat";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { LiveCredentialList } from "@/components/vault/LiveCredentialList";
import {
  CREDENTIALS,
  TONE_BY_CREDENTIAL_STATUS,
  formatBytes,
  shortenDid,
  totalBytesEncrypted,
  uniqueIssuers,
  type CredentialFixture,
} from "@/lib/fixtures/credentials";
import { shortenHex } from "@/lib/fixtures/receipts";

export default function VaultPage() {
  const total = CREDENTIALS.length;
  const bytes = totalBytesEncrypted(CREDENTIALS);
  const issuers = uniqueIssuers(CREDENTIALS);

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
            Vault
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            Maria&apos;s <span className="font-serif italic">credentials</span>, encrypted
            on-device.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Each row mirrors the production envelope: an SD-JWT VC, AES-256-GCM
            -encrypted on the user&apos;s device, ciphertext uploaded to 0G
            Storage. Plaintext claim values stay on the device. The data on
            this page is fixture metadata — the v2 wire-up replaces it with
            live ciphertext rows from a real vault. The columns shown are
            public-by-design even in production: issuer DID, claim names,
            encryption parameters, storage root hash.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            <Stat label="Credentials" value={total} />
            <Stat label="Encrypted bytes" value={formatBytes(bytes)} />
            <Stat label="Issuers" value={issuers} />
          </div>

          <ul className="mt-12 space-y-6">
            {CREDENTIALS.map((c) => (
              <li key={c.id}>
                <CredentialCard credential={c} />
              </li>
            ))}
          </ul>

          <LiveCredentialList />

          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                What this listing shows
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Issuer DID and credential type</li>
                <li>• Names of selectively-disclosable claims</li>
                <li>• Encryption algorithm and KDF parameters</li>
                <li>• 0G Storage root hash of the ciphertext</li>
                <li>• Expiry and most-recent receipt link</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                What it never shows
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Plaintext claim values (name, HKID, employer)</li>
                <li>• The decryption key — never on-chain, never on-device-leaving</li>
                <li>• Document images or PDFs</li>
                <li>• Anything a subpoena of this page could exploit</li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap gap-4">
            <Link
              href="/clinic/subpoena"
              className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase`}
            >
              See the disclosure scene →
            </Link>
            <Link
              href="/onboard"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Onboard another agent →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function CredentialCard({ credential: c }: { credential: CredentialFixture }) {
  return (
    <article className="rounded-2xl border border-border/40 p-6 transition-colors hover:border-foreground/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            {c.vctType}
          </p>
          <h2 className="mt-2 text-xl text-foreground md:text-2xl">{c.issuer}</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {shortenDid(c.issuerDid)}
          </p>
        </div>
        <StatusBadge tone={TONE_BY_CREDENTIAL_STATUS[c.status]} label={c.status} />
      </div>

      <div className="mt-6">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
          Disclosable claims
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {c.disclosableClaims.map((name) => (
            <li
              key={name}
              className="rounded-full border border-border/40 px-3 py-1 font-mono text-xs text-muted-foreground"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Encryption" value={c.encryptionAlg} />
        <Field label="KDF" value={c.kdf} />
        <Field
          label="0G Storage root"
          value={shortenHex(c.storageRootHash, 8, 6)}
          mono
        />
        <Field label="Ciphertext size" value={formatBytes(c.bytesEncrypted)} />
        <Field label="Issued" value={c.issuedAt} />
        <Field label="Expires" value={c.expiresAt} />
      </dl>

      {c.lastReceiptId ? (
        <div className="mt-6">
          <Link
            href={`/receipt/${c.lastReceiptId}`}
            className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            Last receipt #{c.lastReceiptId} →
          </Link>
        </div>
      ) : (
        <p className="mt-6 font-mono text-xs tracking-[0.2em] text-muted-foreground/40 uppercase">
          Not yet disclosed
        </p>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {label}
      </dt>
      <dd className={`mt-1 ${mono ? "font-mono" : ""} text-sm text-foreground`}>
        {value}
      </dd>
    </div>
  );
}
