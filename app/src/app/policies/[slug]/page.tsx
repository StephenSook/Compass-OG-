import Link from "next/link";
import { notFound } from "next/navigation";
import { ClinicHeader } from "@/components/clinic/ClinicHeader";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { GLASS_BASE } from "@/components/primitives/LiquidGlass";
import { Stat } from "@/components/primitives/Stat";
import {
  POLICIES,
  TONE_BY_POLICY_STATUS,
  getPolicyBySlug,
} from "@/lib/fixtures/policies";
import { RECEIPTS, shortenHex } from "@/lib/fixtures/receipts";

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);
  if (!policy) notFound();

  const relatedReceipts = Object.values(RECEIPTS).filter((r) => r.policyId === policy.id);
  const eligibleCount = relatedReceipts.filter((r) => r.eligible).length;
  const deniedCount = relatedReceipts.length - eligibleCount;

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <ClinicHeader href="/" label="← COMPASS" />

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            {policy.id}
          </p>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="text-3xl leading-tight font-medium text-foreground md:text-5xl">
              <span className="font-serif italic">Eligibility</span> for {policy.name.split(" — ")[0]}
            </h1>
            <StatusBadge tone={TONE_BY_POLICY_STATUS[policy.status]} label={policy.status} />
          </div>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            {policy.description}
          </p>

          <Section title="Predicate">
            <ol className="mt-4 space-y-3 font-mono text-sm text-foreground">
              {policy.predicateClaims.map((claim, i) => (
                <li key={claim} className="flex items-start gap-4">
                  <span className="text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{claim}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
              All claims must hold. The TEE evaluates the predicate inside the
              attested image. The policy hash binds into the receipt's
              attestation digest.
            </p>
          </Section>

          <Section title="Issuer">
            <p className="text-foreground">{policy.issuer}</p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {policy.issuerNote}
            </p>
          </Section>

          <Section title="On-chain registration">
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="policyHash" value={shortenHex(policy.policyHash, 8, 6)} mono />
              <Field label="min anonymity set" value={`k ≥ ${policy.minAnonymitySet}`} mono />
              <Field label="registered" value={policy.registeredAt} mono />
            </dl>
          </Section>

          <Section title="Receipts">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Stat label="Total" value={relatedReceipts.length} />
              <Stat label="Eligible" value={eligibleCount} />
              <Stat label="Denied" value={deniedCount} />
            </div>
            {relatedReceipts.length > 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                <Link
                  href="/clinic/inbox"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Open the receipt inbox →
                </Link>{" "}
                Public fields only.
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                No receipts issued yet under this policy.
              </p>
            )}
          </Section>

          <div className="mt-16 flex flex-wrap justify-center gap-4">
            <Link
              href="/clinic/policies"
              className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase`}
            >
              All policies →
            </Link>
            <Link
              href="/audit"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Public audit log →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
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

