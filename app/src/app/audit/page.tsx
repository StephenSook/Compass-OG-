import Link from "next/link";
import { ClinicHeader } from "@/components/clinic/ClinicHeader";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { POLICIES } from "@/lib/fixtures/policies";
import { RECEIPTS, shortenHex } from "@/lib/fixtures/receipts";

export default function AuditPage() {
  const rows = Object.entries(RECEIPTS)
    .map(([id, r]) => ({ id, ...r }))
    .sort(
      (a, b) =>
        b.timestampBucketSec - a.timestampBucketSec ||
        a.receiptId.localeCompare(b.receiptId),
    );

  const total = rows.length;
  const eligible = rows.filter((r) => r.eligible).length;
  const denied = total - eligible;
  const policiesIssued = new Set(rows.map((r) => r.policyId)).size;

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <ClinicHeader href="/" label="← COMPASS" />

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-5xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Public audit log
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Everything</span> we publish.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Every Compass receipt is logged on-chain at the 15-minute bucket.
            The full public ledger is below. No name, HKID, employer, or
            document field appears in any row, today or under subpoena.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Receipts issued" value={total} />
            <Stat label="Eligible" value={eligible} />
            <Stat label="Denied" value={denied} />
            <Stat label="Policies in use" value={`${policiesIssued} / ${POLICIES.length}`} />
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <Th>Receipt</Th>
                  <Th>Policy</Th>
                  <Th>Result</Th>
                  <Th>Bucket</Th>
                  <Th align="right">Verify</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const bucket = new Date(row.timestampBucketSec * 1000)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 16);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/20 transition-colors hover:bg-foreground/[0.02]"
                    >
                      <td className="py-4 pr-4 font-mono text-xs text-foreground">
                        {shortenHex(row.receiptId, 6, 6)}
                      </td>
                      <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
                        {row.policyId}
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge
                          tone={row.eligible ? "positive" : "warning"}
                          label={row.eligible ? "eligible" : "denied"}
                        />
                      </td>
                      <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
                        {bucket} UTC
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/receipt/${row.id}`}
                          className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-border/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                What this contains
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Receipt commitment hashes</li>
                <li>• Policy identifiers</li>
                <li>• Eligible / denied result</li>
                <li>• 15-minute timestamp bucket</li>
                <li>• Link to on-chain attestation digest</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                What it never contains
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Names or HKIDs</li>
                <li>• Employer or contract details</li>
                <li>• Document images</li>
                <li>• Wall-clock timestamps below 15 minutes</li>
                <li>• Anything a subpoena can pry into identity</li>
              </ul>
            </div>
          </div>

          <p className="mt-16 max-w-2xl text-sm text-muted-foreground/70">
            Want to see what a subpoenaed snapshot looks like next to a receipt?{" "}
            <Link
              href="/clinic/subpoena"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Open the disclosure scene →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`pb-4 font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/40 p-6">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-medium text-foreground">{value}</p>
    </div>
  );
}
