import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Read-only rating row. One implementation for cards, heroes, reviews and profiles. */
export function Stars({
  value,
  count,
  size = 16,
  showValue = true,
  className,
}: {
  value: number;
  /** Review count, rendered muted in parentheses */
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={`${value.toFixed(1)} out of 5 stars${count !== undefined ? `, ${count} reviews` : ""}`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= rounded ? "text-star" : "text-line"}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </span>
      {showValue && (
        <span className="font-mono text-sm font-semibold text-ink" aria-hidden>
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-muted" aria-hidden>
          ({count})
        </span>
      )}
    </span>
  );
}
