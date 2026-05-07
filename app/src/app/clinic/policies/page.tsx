import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";
import { POLICIES, type PolicyFixture } from "@/lib/fixtures/policies";
import { shortenHex } from "@/lib/fixtures/receipts";

export default function PoliciesPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <LiquidGlass radius="full" className="px-6 py-2">
          <Link
            href="/clinic"
            className="font-mono text-xs tracking-[0.3em] text-foreground uppercase"
          >
            ← CLINIC
          </Link>
        </LiquidGlass>
      </header>

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Policy Registry
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Policies</span> registered.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Each policy publishes its predicate, its issuer, and its k-anonymity
            floor before any receipt is issued. Eligibility checks evaluate the
            predicate inside the TEE; the policy hash is bound into the
            attestation digest.
          </p>

          <div className="mt-16 space-y-4">
            {POLICIES.map((p) => (
              <PolicyCard key={p.id} policy={p} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function PolicyCard({ policy }: { policy: PolicyFixture }) {
  const statusColor =
    policy.status === "active"
      ? "text-green-400/80 border-green-400/30"
      : policy.status === "draft"
        ? "text-amber-400/80 border-amber-400/30"
        : "text-muted-foreground/70 border-border/40";
  return (
    <article className="rounded-2xl border border-border/40 p-8 transition-colors hover:border-foreground/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            {policy.id}
          </p>
          <h2 className="mt-2 text-xl text-foreground md:text-2xl">{policy.name}</h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground/70">
            {policy.issuer}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase ${statusColor}`}
        >
          {policy.status}
        </span>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{policy.description}</p>

      <dl className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Predicate
          </dt>
          <dd className="mt-1 font-mono text-xs text-foreground">{policy.predicate}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            min anonymity set
          </dt>
          <dd className="mt-1 font-mono text-xs text-foreground">k ≥ {policy.minAnonymitySet}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            policyHash
          </dt>
          <dd className="mt-1 font-mono text-xs text-foreground">
            {shortenHex(policy.policyHash, 8, 6)}
          </dd>
        </div>
      </dl>
      <p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Registered {policy.registeredAt}
      </p>
    </article>
  );
}
