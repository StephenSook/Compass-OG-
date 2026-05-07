import Link from "next/link";
import { ClinicHeader } from "@/components/clinic/ClinicHeader";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import {
  RECEIPTS,
  formatExpiry,
  shortenHex,
  type ReceiptFixture,
} from "@/lib/fixtures/receipts";

export default function ClinicInboxPage() {
  const rows = Object.entries(RECEIPTS)
    .map(([id, r]) => ({ id, ...r }))
    .sort(
      (a, b) =>
        b.timestampBucketSec - a.timestampBucketSec ||
        a.receiptId.localeCompare(b.receiptId),
    );

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <ClinicHeader href="/clinic" label="← CLINIC" />

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-5xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Receipt Inbox
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Receipts</span> in evidence.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            This is the entire log we can produce under a PDPO §57 disclosure
            order. No identity fields anywhere. Every row is a non-revocable
            on-chain receipt with a 15-minute timestamp bucket.
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <Th>Receipt</Th>
                  <Th>Policy</Th>
                  <Th>Result</Th>
                  <Th>Bucket</Th>
                  <Th>Expiry</Th>
                  <Th align="right">View</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-16 max-w-2xl text-sm text-muted-foreground/70">
            The disclosure scene shows what a subpoenaed snapshot looks like.{" "}
            <Link
              href="/clinic/subpoena"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Open it →
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

function Row({ row }: { row: ReceiptFixture & { id: string } }) {
  const bucket = new Date(row.timestampBucketSec * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 16);
  return (
    <tr className="border-b border-border/20 transition-colors hover:bg-foreground/[0.02]">
      <td className="py-4 pr-4 font-mono text-xs text-foreground">
        {shortenHex(row.receiptId, 6, 6)}
      </td>
      <td className="py-4 pr-4 text-sm text-foreground">{row.policyName}</td>
      <td className="py-4 pr-4">
        <StatusBadge
          tone={row.eligible ? "positive" : "warning"}
          label={row.eligible ? "eligible" : "denied"}
        />
      </td>
      <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">{bucket} UTC</td>
      <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
        {formatExpiry(row.expirySec)}
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
}
