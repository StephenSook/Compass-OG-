import Link from "next/link";
import { LiquidGlass } from "@/components/primitives/LiquidGlass";

type ClinicHeaderProps = {
  href: string;
  label: string;
};

export function ClinicHeader({ href, label }: ClinicHeaderProps) {
  return (
    <header className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
      <LiquidGlass radius="full" className="px-6 py-2">
        <Link
          href={href}
          className="font-mono text-xs tracking-[0.3em] text-foreground uppercase"
        >
          {label}
        </Link>
      </LiquidGlass>
    </header>
  );
}
