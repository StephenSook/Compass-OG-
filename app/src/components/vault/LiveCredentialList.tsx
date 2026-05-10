"use client";

import { useEffect, useState } from "react";

type LiveCredential = {
  sdjwtvc: string;
  issuerDid: string;
  vct: string;
  claimNames: string[];
  issuedAt: number;
  expiresAt: number;
};

const STORAGE_KEY = "compass.live_credentials";

export function LiveCredentialList() {
  const [creds, setCreds] = useState<LiveCredential[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as LiveCredential[]) : [];
      setCreds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCreds([]);
    }
    setHydrated(true);
  }, []);

  if (!hydrated || creds.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        Live credentials (this device)
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        SD-JWT VCs signed by <span className="font-mono">/api/issue</span> on
        this browser session. Stored in localStorage; cleared on{" "}
        <span className="font-mono">/onboard</span> reset. v2 wraps these in
        AES-256-GCM and uploads ciphertext to 0G Storage.
      </p>
      <ul className="mt-6 space-y-4">
        {creds.map((c, i) => (
          <li
            key={`${c.issuedAt}-${i}`}
            className="rounded-2xl border border-foreground/30 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                  {c.vct}
                </p>
                <h3 className="mt-2 text-lg text-foreground">Live SD-JWT VC</h3>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {c.issuerDid}
                </p>
              </div>
              <span className="rounded-full border border-green-400/30 px-3 py-1 font-mono text-[10px] tracking-[0.3em] text-green-400/80 uppercase">
                live
              </span>
            </div>

            <div className="mt-4">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Disclosable claims
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {c.claimNames.map((n) => (
                  <li
                    key={n}
                    className="rounded-full border border-border/40 px-3 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Issued"
                value={new Date(c.issuedAt * 1000).toISOString().slice(0, 10)}
              />
              <Field
                label="Expires"
                value={new Date(c.expiresAt * 1000).toISOString().slice(0, 10)}
              />
              <div className="md:col-span-2">
                <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                  SD-JWT VC (compact)
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {c.sdjwtvc.length > 140
                    ? `${c.sdjwtvc.slice(0, 96)}…${c.sdjwtvc.slice(-32)}`
                    : c.sdjwtvc}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
