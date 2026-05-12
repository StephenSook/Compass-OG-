type Tone = "positive" | "warning" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  positive: "border-green-400/30 text-green-400/80",
  warning: "border-amber-400/30 text-amber-400/80",
  neutral: "border-border/40 text-muted-foreground/70",
};

export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}
