"use client";

import { Columns3, Check } from "lucide-react";
import { useCompare } from "@/components/CompareProvider";
import { useToast } from "@/components/ToastProvider";
import { COMPARE_MAX } from "@/lib/compare";
import { cn } from "@/lib/cn";

/** Adds/removes a school from the compare tray. Sibling of card links, never nested. */
export function CompareButton({
  id,
  name,
  href,
  size = "sm",
  showLabel = false,
  className,
}: {
  id: string;
  name: string;
  href: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const { has, full, toggle } = useCompare();
  const toast = useToast();
  const active = has(id);
  const disabled = !active && full;
  const iconSize = size === "sm" ? 16 : 18;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      title={disabled ? `Compare up to ${COMPARE_MAX} schools` : active ? "In compare" : "Compare"}
      aria-disabled={disabled}
      onClick={() => {
        if (!toggle({ id, name, href })) {
          toast.info(
            "Compare is full",
            `You can compare up to ${COMPARE_MAX} schools at a time — remove one from the tray to add ${name}.`,
          );
        }
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full border text-sm font-semibold",
        "transition-[background-color,color,border-color] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        disabled && "cursor-not-allowed opacity-40",
        active
          ? "border-sky/40 bg-surface-2 text-sky"
          : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink",
        size === "sm" ? "h-9 w-9" : "h-11 gap-2 px-4",
        className,
      )}
    >
      {active ? <Check size={iconSize} aria-hidden /> : <Columns3 size={iconSize} aria-hidden />}
      {showLabel && (active ? "Comparing" : "Compare")}
    </button>
  );
}
