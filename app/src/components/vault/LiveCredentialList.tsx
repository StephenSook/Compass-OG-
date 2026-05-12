"use client";

import { useEffect, useState } from "react";
import {
  isStoredLiveCredential,
  type StoredLiveCredential,
} from "@/lib/crypto/vault";
import { CredentialCardSkeleton } from "@/components/primitives/Skeleton";

const STORAGE_KEY = "compass.live_credentials";

export function LiveCredentialList() {
  const [creds, setCreds] = useState<StoredLiveCredential[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setHasStoredKey(raw !== null);
      const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
      const filtered = Array.isArray(parsed)
        ? parsed.filter(isStoredLiveCredential)
        : [];
      setCreds(filtered);
    } catch {
      setCreds([]);
    }
    setHydrated(true);
  }, []);

  // While hydrating, only render the skeleton if localStorage suggests the
  // user *has* live credentials — otherwise we'd flash a placeholder for
  // every fresh visitor, which is worse than rendering nothing.
  if (!hydrated) {
    if (typeof window === "undefined") return null;
    if (!window.localStorage.getItem(STORAGE_KEY)) return null;
    return (
      <section className="mt-16">
        <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
          Live credentials (this device)
        </p>
        <ul className="mt-6 space-y-4" aria-busy="true">
          <li>
            <CredentialCardSkeleton />
          </li>
        </ul>
      </section>
    );
  }

  if (creds.length === 0) return null;
  // Avoid an unused-variable lint warning on hasStoredKey while keeping
  // the state available for telemetry / future surfaces.
  void hasStoredKey;

  return (
    <section className="mt-16">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        Live credentials (this device)
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        SD-JWT VCs signed by <span className="font-mono">/api/issue</span> and
        encrypted browser-side with AES-256-GCM before persisting. Per-device
        key is a non-extractable AES-256 in IndexedDB; the plaintext SD-JWT VC
        never enters localStorage. 0G Storage ciphertext upload is still v2.
      </p>
      <ul className="mt-6 space-y-4">
        {creds.map((c, i) => (
          <li
            key={`${c.encryptedAt}-${i}`}
            className="rounded-2xl border border-foreground/30 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                  {c.vct}
                </p>
                <h3 className="mt-2 text-lg text-foreground">
                  Live SD-JWT VC · ciphertext only
                </h3>
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
              <Field label="Encryption" value={c.algorithm} />
              <Field label="Key source" value={c.keySource} />
              <Field
                label="Ciphertext size"
                value={`${c.bytesEncrypted} B`}
              />
              <Field
                label="IV (96-bit)"
                value={c.iv}
                mono
              />
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
                  Ciphertext (AES-256-GCM, base64url)
                </dt>
                <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {c.ciphertext.length > 140
                    ? `${c.ciphertext.slice(0, 96)}…${c.ciphertext.slice(-32)}`
                    : c.ciphertext}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
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
      <dd className={`mt-1 ${mono ? "break-all font-mono" : ""} text-sm text-foreground`}>
        {value}
      </dd>
    </div>
  );
}
