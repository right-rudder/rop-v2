import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The mark: the hero radar (SectionalMotif) reduced to a 32-unit scope —
 * outer range ring, fine-dashed inner ring, the sweep with one contact under
 * it, and the sectional-chart airport symbol at the centre as our station.
 * Strokes use currentColor; set text-accent (or any color) on it.
 *
 * Source of truth for the geometry. app/icon.svg and app/apple-icon.tsx
 * repeat it on the night tile (icon.svg drops the inner ring so the 16 px
 * favicon stays crisp); app/opengraph-image.tsx uses it beside the wordmark.
 */
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
      <g stroke="currentColor" strokeLinecap="round">
        {/* range rings */}
        <circle cx="16" cy="16" r="14.5" strokeWidth="1.5" opacity="0.9" />
        <circle cx="16" cy="16" r="10" strokeWidth="1.25" strokeDasharray="1.5 3" opacity="0.55" />
        {/* sweep, and the contact it just lit */}
        <path d="M16 16 L16 1.5 A14.5 14.5 0 0 1 28.6 8.8 Z" fill="currentColor" stroke="none" opacity="0.22" />
        <line x1="16" y1="16" x2="28.6" y2="8.8" strokeWidth="1.5" opacity="0.9" />
        <circle cx="23.5" cy="20.5" r="1.9" fill="currentColor" stroke="none" />
        {/* airport glyph: our station */}
        <g strokeWidth="2.4">
          <circle cx="16" cy="16" r="4.2" />
          <line x1="16" y1="8.5" x2="16" y2="10.6" />
          <line x1="16" y1="21.4" x2="16" y2="23.5" />
          <line x1="8.5" y1="16" x2="10.6" y2="16" />
          <line x1="21.4" y1="16" x2="23.5" y2="16" />
        </g>
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
      {/* The hover turn reads as the sweep advancing a step */}
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
