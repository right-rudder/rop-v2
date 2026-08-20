import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Mono, uppercase, letter-spaced label — the "chart data" voice. */
export function Eyebrow({
  className,
  children,
  accent,
  style,
}: {
  className?: string;
  children: ReactNode;
  /** Leading magenta dot (sectional airport marker) */
  accent?: boolean;
  style?: CSSProperties;
}) {
  return (
    <p
      className={cn(
        "inline-flex flex-wrap items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted",
        className,
      )}
      style={style}
    >
      {accent && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
      {children}
    </p>
  );
}
