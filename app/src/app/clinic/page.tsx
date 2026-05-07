import Link from "next/link";
import { GLASS_BASE, LiquidGlass } from "@/components/primitives/LiquidGlass";
import { POLICIES } from "@/lib/fixtures/policies";
import { RECEIPTS } from "@/lib/fixtures/receipts";

export default function ClinicIndexPage() {
  const activePolicies = POLICIES.filter((p) => p.status === "active").length;
  const totalReceipts = Object.keys(RECEIPTS).length;

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <header className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
        <LiquidGlass radius="full" className="px-6 py-2">
          <Link
            href="/"
            className="font-mono text-xs tracking-[0.3em] text-foreground uppercase"
          >
            COMPASS
          </Link>
        </LiquidGlass>
      </header>

      <section className="flex flex-1 flex-col items-center px-6 pt-32 pb-24">
        <div className="w-full max-w-4xl">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
            Clinic Dashboard
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-medium text-foreground md:text-6xl">
            <span className="font-serif italic">Receipts</span>, not records.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            Compass clinics never see names, HKIDs, or contracts. They see
            non-identifying eligibility receipts — enough to extend service,
            and the entire log a subpoena can reach.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Active policies
              </p>
              <p className="mt-2 text-4xl font-medium text-foreground">{activePolicies}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground/70">
                {POLICIES.length - activePolicies} in draft
              </p>
            </div>
            <div className="rounded-2xl border border-border/40 p-6">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Receipts in evidence
              </p>
              <p className="mt-2 text-4xl font-medium text-foreground">{totalReceipts}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground/70">
                bucketed timestamps · zero PII
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/clinic/policies"
              className="group rounded-2xl border border-border/40 p-8 transition-colors hover:border-foreground/40"
            >
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Browse
              </p>
              <p className="mt-3 text-2xl text-foreground">Policy registry</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Three demo policies covering free legal aid, emergency shelter
                intake, and free public-hospital care for FDHs.
              </p>
              <p className="mt-6 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors group-hover:text-foreground">
                Open registry →
              </p>
            </Link>
            <Link
              href="/clinic/inbox"
              className="group rounded-2xl border border-border/40 p-8 transition-colors hover:border-foreground/40"
            >
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Inspect
              </p>
              <p className="mt-3 text-2xl text-foreground">Receipt inbox</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Public fields only. Bucketed timestamps. The exact log a
                subpoena under PDPO §57 would reach.
              </p>
              <p className="mt-6 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase transition-colors group-hover:text-foreground">
                Open inbox →
              </p>
            </Link>
          </div>

          <div className="mt-16 flex justify-center">
            <Link
              href="/clinic/subpoena"
              className={`${GLASS_BASE} rounded-full px-8 py-4 font-mono text-xs tracking-[0.3em] text-foreground uppercase transition-colors`}
            >
              See the subpoena scene →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
