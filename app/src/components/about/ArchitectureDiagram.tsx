// Inline SVG (not external asset) so colors track Cinematic Privacy
// palette and the diagram scales without a round-trip.

const LAYERS = [
  {
    id: "device",
    layer: "Layer 1",
    title: "User device",
    subtitle: "Next.js · user-controlled EOA",
    bullets: [
      "secp256k1 key (Privy wired; fixture by default)",
      "AES-256-GCM vault (Node CLI v1, browser v2)",
      "SD-JWT VC (selective disclosure capable)",
    ],
  },
  {
    id: "storage",
    layer: "Layer 2",
    title: "0G Storage",
    subtitle: "Galileo testnet · encrypted blob",
    bullets: [
      "ciphertext SD-JWT bundle",
      "Merkle root → AgentRegistry.encryptedURI",
      "user-held decryption key, never on-chain",
    ],
  },
  {
    id: "tee",
    layer: "Layer 3",
    title: "0G Sealed Inference",
    subtitle: "Phala dstack TDX · receipt-signer",
    bullets: [
      "dstack-derived secp256k1 signer",
      "per-receipt quote (freshness binding)",
      "policy evaluator → eligible / denied",
    ],
  },
  {
    id: "chain",
    layer: "Layer 4",
    title: "0G Chain",
    subtitle: "AgentRegistry · CompassHub",
    bullets: [
      "soulbound INFT (agent identity)",
      "single-use grant + nullifier (contract primitives)",
      "ReceiptIssued event (15-min bucket)",
    ],
  },
] as const;

const ARROWS = [
  { from: 0, to: 1, label: "encrypted vault → 0G Storage" },
  { from: 1, to: 2, label: "policy-relevant claims" },
  { from: 2, to: 3, label: "ReceiptIssued" },
] as const;

const BOX_W = 760;
const BOX_H = 144;
const ARROW_H = 56;
const PADDING_X = 20;
const PADDING_Y = 8;
const TOTAL_W = BOX_W + PADDING_X * 2;
const TOTAL_H = LAYERS.length * BOX_H + (LAYERS.length - 1) * ARROW_H + PADDING_Y * 2;

function layerY(i: number) {
  return PADDING_Y + i * (BOX_H + ARROW_H);
}

export function ArchitectureDiagram() {
  return (
    <svg
      role="img"
      aria-labelledby="arch-title arch-desc"
      viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
    >
      <title id="arch-title">Compass four-layer architecture</title>
      <desc id="arch-desc">
        User holds an SD-JWT credential. The vault is AES-256-GCM-encrypted
        and uploaded to 0G Storage. The receipt-signer inside Phala dstack
        TDX receives the policy-relevant claims, evaluates the predicate,
        and signs a receipt with a key sealed inside the attested image.
        ReceiptIssued lands on 0G Chain — public fields only.
      </desc>

      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="9"
          markerHeight="9"
          orient="auto"
        >
          <path d="M 0 0 L 12 6 L 0 12 Z" fill="rgba(255,255,255,0.45)" />
        </marker>
      </defs>

      {LAYERS.map((layer, i) => (
        <g key={layer.id}>
          <rect
            x={PADDING_X}
            y={layerY(i)}
            width={BOX_W}
            height={BOX_H}
            rx={20}
            ry={20}
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
          <text
            x={PADDING_X + 24}
            y={layerY(i) + 28}
            className="font-mono uppercase"
            fontSize="10"
            letterSpacing="3"
            fill="rgba(255,255,255,0.45)"
          >
            {layer.layer}
          </text>
          <text
            x={PADDING_X + BOX_W - 24}
            y={layerY(i) + 28}
            className="font-mono uppercase"
            fontSize="10"
            letterSpacing="3"
            fill="rgba(255,255,255,0.35)"
            textAnchor="end"
          >
            {layer.subtitle}
          </text>
          <text
            x={PADDING_X + 24}
            y={layerY(i) + 60}
            fontSize="20"
            fontWeight="500"
            fill="rgba(255,255,255,0.96)"
          >
            {layer.title}
          </text>
          {layer.bullets.map((b, bi) => (
            <text
              key={b}
              x={PADDING_X + 24}
              y={layerY(i) + 90 + bi * 20}
              fontSize="13"
              fill="rgba(255,255,255,0.62)"
            >
              · {b}
            </text>
          ))}
        </g>
      ))}

      {ARROWS.map((arrow) => {
        const fromY = layerY(arrow.from) + BOX_H;
        const toY = layerY(arrow.to);
        const midY = (fromY + toY) / 2;
        const x = PADDING_X + BOX_W / 2;
        return (
          <g key={`${arrow.from}-${arrow.to}`}>
            <line
              x1={x}
              y1={fromY + 4}
              x2={x}
              y2={toY - 8}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
            <text
              x={x + 14}
              y={midY + 4}
              className="font-mono uppercase"
              fontSize="10"
              letterSpacing="2"
              fill="rgba(255,255,255,0.55)"
            >
              {arrow.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
