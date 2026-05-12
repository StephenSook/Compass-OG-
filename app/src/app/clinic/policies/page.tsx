import Link from "next/link";
import { ClinicHeader } from "@/components/clinic/ClinicHeader";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import {
  POLICIES,
  TONE_BY_POLICY_STATUS,
  predicateExpression,
  type PolicyFixture,
} from "@/lib/fixtures/policies";
import { shortenHex } from "@/lib/fixtures/receipts";


export default function PoliciesPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <ClinicHeader href="/clinic" label="← CLINIC" />

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
        <StatusBadge tone={TONE_BY_POLICY_STATUS[policy.status]} label={policy.status} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{policy.description}</p>

      <dl className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Predicate
          </dt>
          <dd className="mt-1 font-mono text-xs text-foreground">{predicateExpression(policy)}</dd>
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
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          Registered {policy.registeredAt}
        </p>
        <Link
          href={`/policies/${policy.slug}`}
          className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Open detail →
        </Link>
      </div>
    </article>
  );
}
