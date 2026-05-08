type StatProps = {
  label: string;
  value: number | string;
};

export function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-2xl border border-border/40 p-6">
      <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-medium text-foreground">{value}</p>
    </div>
  );
}
