type ThProps = {
  children: React.ReactNode;
  align?: "left" | "right";
};

export function Th({ children, align = "left" }: ThProps) {
  return (
    <th
      scope="col"
      className={`pb-4 font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
