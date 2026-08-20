import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * The signature: concentric airspace rings around a sectional-chart airport
 * glyph. Stroke color comes from `currentColor` — set text-accent on it.
 * Rings grow in on mount (.ring-in); static when `animate` is false.
 */
export function SectionalMotif({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const rings = [90, 170, 250, 330];
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <svg
      viewBox="0 0 720 720"
      fill="none"
      aria-hidden
      className={cn("text-accent", className)}
    >
      <g stroke="currentColor" strokeLinecap="round">
        {rings.map((r, i) => (
          <circle
            key={r}
            cx="360"
            cy="360"
            r={r}
            strokeWidth={i === rings.length - 1 ? 1.25 : 1.5}
            strokeDasharray={i % 2 === 0 ? "2 10" : "14 10"}
            opacity={1 - i * 0.18}
            className={animate ? "ring-in" : undefined}
            style={{ "--i": i + 1 } as CSSProperties}
          />
        ))}
        {/* compass ticks on the outer ring */}
        <g
          strokeWidth="1.25"
          opacity="0.55"
          className={animate ? "ring-in" : undefined}
          style={{ "--i": 5 } as CSSProperties}
        >
          {ticks.map((deg) => (
            <line
              key={deg}
              x1="360"
              y1="14"
              x2="360"
              y2={deg % 90 === 0 ? 34 : deg % 30 === 0 ? 26 : 20}
              transform={`rotate(${deg} 360 360)`}
            />
          ))}
        </g>
        {/* airport glyph */}
        <g strokeWidth="2.5" className={animate ? "ring-in" : undefined} style={{ "--i": 0 } as CSSProperties}>
          <circle cx="360" cy="360" r="18" />
          <line x1="360" y1="326" x2="360" y2="340" />
          <line x1="360" y1="380" x2="360" y2="394" />
          <line x1="326" y1="360" x2="340" y2="360" />
          <line x1="380" y1="360" x2="394" y2="360" />
        </g>
      </g>
    </svg>
  );
}
