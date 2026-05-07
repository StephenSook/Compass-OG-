/**
 * Four-layer view of the Compass data flow. Embedded inline so colors track
 * the Cinematic Privacy palette without an external SVG asset.
 */
const LAYERS = [
  {
    id: "device",
    title: "User device",
    subtitle: "Next.js · Privy embedded wallet",
    bullets: [
      "secp256k1 key (Privy)",
      "AES-256-GCM vault encryption",
      "SD-JWT VC selective disclosure",
    ],
  },
  {
    id: "storage",
    title: "0G Storage",
    subtitle: "Galileo testnet · encrypted blob",
    bullets: [
      "ciphertext SD-JWT bundle",
      "Merkle root → AgentRegistry.encryptedURI",
      "client-only decryption key",
    ],
  },
  {
    id: "tee",
    title: "0G Sealed Inference",
    subtitle: "Phala dstack TDX · receipt-signer",
    bullets: [
      "dstack-derived secp256k1 signer",
      "per-receipt quote (freshness binding)",
      "policy evaluator → eligible/denied",
    ],
  },
  {
    id: "chain",
    title: "0G Chain",
    subtitle: "AgentRegistry · CompassHub",
    bullets: [
      "soulbound INFT (agent identity)",
      "Authwit grants + nullifier",
      "ReceiptIssued event log (15-min bucket)",
    ],
  },
] as const;

export function ArchitectureDiagram() {
  return (
    <div className="space-y-3">
      {LAYERS.map((layer, i) => (
        <div key={layer.id}>
          <article className="rounded-2xl border border-border/40 p-6 transition-colors hover:border-foreground/30">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
                Layer {i + 1}
              </p>
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase">
                {layer.subtitle}
              </p>
            </div>
            <h3 className="mt-2 text-xl text-foreground md:text-2xl">{layer.title}</h3>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {layer.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="font-mono text-muted-foreground/40">·</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </article>
          {i < LAYERS.length - 1 ? (
            <div className="my-2 flex justify-center">
              <span className="font-mono text-xs text-muted-foreground/40" aria-hidden>
                ↓
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
