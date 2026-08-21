import Link from "next/link";
import { cn } from "@/lib/cn";

/** Sectional-chart airport symbol: circle with four ticks. */
export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("text-accent", className)}
    >
      <g stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
        <circle cx="16" cy="16" r="7" />
        <line x1="16" y1="1.5" x2="16" y2="6" />
        <line x1="16" y1="26" x2="16" y2="30.5" />
        <line x1="1.5" y1="16" x2="6" y2="16" />
        <line x1="26" y1="16" x2="30.5" y2="16" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        className,
      )}
      aria-label="Flight School Finder — home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-45" />
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight text-ink",
          wordmarkClassName,
        )}
      >
        Flight School Finder
      </span>
    </Link>
  );
}
