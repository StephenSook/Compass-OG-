import Link from "next/link";
import { ClinicHeader } from "@/components/clinic/ClinicHeader";
import { Stat } from "@/components/primitives/Stat";
import { RECEIPTS } from "@/lib/fixtures/receipts";
import { POLICIES } from "@/lib/fixtures/policies";

// /analytics — receipts-over-time view. Read-only fixture data for v1; v2
// queries Galileo CompassHub for live ReceiptIssued events bucketed by the
// emitted timestampBucket field. The page's privacy framing is the load-
// bearing claim: judges see growth + distribution without any PII.

function buildBuckets(): { bucket: number; count: number; policyMix: Record<string, number> }[] {
  const rows = Object.values(RECEIPTS).map((r) => ({
    bucket: r.timestampBucketSec,
    policyId: r.policyId,
    eligible: r.eligible,
  }));
  const map = new Map<number, { count: number; policyMix: Record<string, number> }>();
  for (const r of rows) {
    const cur = map.get(r.bucket) ?? { count: 0, policyMix: {} };
    cur.count += 1;
    cur.policyMix[r.policyId] = (cur.policyMix[r.policyId] ?? 0) + 1;
    map.set(r.bucket, cur);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([bucket, v]) => ({ bucket, count: v.count, policyMix: v.policyMix }));
}

export default function AnalyticsPage() {
  const buckets = buildBuckets();
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const eligibleTotal = Object.values(RECEIPTS).filter((r) => r.eligible).length;
  const policiesIssued = new Set(Object.values(RECEIPTS).map((r) => r.policyId)).size;
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <ClinicHeader href="/" label="← COMPASS" />

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Analytics
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            Receipts <span className="font-serif italic">over time</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Every Compass receipt commits to a 15-minute timestamp bucket on
            0G Chain. This page renders the bucketed event histogram —
            growth, distribution by policy, eligible vs denied. No name, no
            HKID, no employer, no document field appears here, because none
            of those fields ever land in a receipt.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="Receipts issued" value={total} />
            <Stat label="Eligible" value={`${eligibleTotal} / ${total}`} />
            <Stat label="Distinct policies" value={policiesIssued} />
          </div>

          <Section title="Histogram — receipts per 15-min bucket">
            {buckets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No on-chain receipts yet. v2 wires this to live Galileo
                <span className="font-mono"> ReceiptIssued</span> events.
              </p>
            ) : (
              <Histogram buckets={buckets} maxCount={maxCount} />
            )}
          </Section>

          <Section title="By policy">
            <ul className="space-y-3">
              {POLICIES.map((p) => {
                const count = Object.values(RECEIPTS).filter(
                  (r) => r.policyId === p.id,
                ).length;
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                        {p.slug}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{p.name}</p>
                    </div>
                    <span className="font-mono text-2xl text-foreground">{count}</span>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title="What this page does NOT show">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Names, HKIDs, employer names, document images</li>
              <li>• The applicant&apos;s agent INFT tokenId (only an opaque commitment)</li>
              <li>• Sub-bucket precision (the 15-min floor is the privacy primitive)</li>
              <li>• Which credentials were disclosed beyond the claim names</li>
              <li>• Anything a subpoena of this page could exploit</li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              The same privacy rule that holds on{" "}
              <Link href="/clinic/subpoena" className="text-foreground underline-offset-4 hover:underline">
                /clinic/subpoena
              </Link>{" "}
              holds here: the data simply does not exist. Aggregation does
              not relax the disclosure surface.
            </p>
          </Section>

          <div className="mt-16 flex flex-wrap gap-4">
            <Link
              href="/audit"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              Public audit log →
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-border px-8 py-4 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground hover:border-foreground/40"
            >
              About →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Histogram({
  buckets,
  maxCount,
}: {
  buckets: { bucket: number; count: number; policyMix: Record<string, number> }[];
  maxCount: number;
}) {
  const barWidth = 40;
  const barGap = 10;
  const chartHeight = 200;
  const chartWidth = buckets.length * (barWidth + barGap);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
        width={Math.max(chartWidth, 360)}
        height={chartHeight + 50}
        className="text-foreground"
      >
        {buckets.map((b, i) => {
          const h = (b.count / maxCount) * chartHeight;
          const x = i * (barWidth + barGap);
          const y = chartHeight - h;
          const date = new Date(b.bucket * 1000);
          return (
            <g key={b.bucket}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                fill="currentColor"
                opacity="0.7"
                rx="2"
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                fill="currentColor"
                fontSize="11"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {b.count}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                fill="currentColor"
                fontSize="9"
                opacity="0.5"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {date.toISOString().slice(11, 16)}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 32}
                fill="currentColor"
                fontSize="8"
                opacity="0.4"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {date.toISOString().slice(5, 10)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
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
