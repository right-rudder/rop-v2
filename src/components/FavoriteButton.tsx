"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";
import { cn } from "@/lib/cn";

const sizes = { sm: "h-9 w-9", md: "h-11 gap-2 px-4" } as const;

/**
 * Heart toggle. Renders a login link for guests. Never place inside another
 * <a>: callers position it as a sibling of the card link.
 */
export function FavoriteButton({
  schoolId,
  path,
  size = "sm",
  showLabel = false,
  className,
}: {
  schoolId: string;
  /** Page to re-render after toggling (usually the current pathname). */
  path: string;
  size?: keyof typeof sizes;
  showLabel?: boolean;
  className?: string;
}) {
  const { viewerId, ids, pending, toggle, lastError } = useFavorites();
  const saved = ids.has(schoolId);
  const busy = pending.has(schoolId);
  const base = cn(
    "inline-flex items-center justify-center rounded-full border text-sm font-semibold",
    "transition-[background-color,color,border-color,transform,translate] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    saved
      ? "border-accent/40 bg-accent-soft text-accent-ink"
      : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink",
    sizes[size],
    className,
  );
  const icon = (
    <Heart
      size={size === "sm" ? 16 : 18}
      aria-hidden
      className={cn("transition-transform", saved && "scale-110 fill-current")}
    />
  );

  if (!viewerId) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(path)}`}
        aria-label="Log in to save this school"
        title="Log in to save"
        className={base}
      >
        {icon}
        {showLabel && "Save"}
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved schools" : "Save school"}
        title={saved ? "Saved" : "Save"}
        disabled={busy}
        onClick={() => toggle(schoolId, path)}
        className={cn(base, busy && "opacity-60")}
      >
        {icon}
        {showLabel && (saved ? "Saved" : "Save")}
      </button>
      {lastError && (
        <span className="sr-only" aria-live="polite">
          {lastError}
        </span>
      )}
    </>
  );
}
