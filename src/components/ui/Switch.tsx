import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<"input">, "type" | "className"> & {
  label: ReactNode;
  description?: ReactNode;
  className?: string;
};

/**
 * On/off toggle that submits like a checkbox (`name=on` when checked), so it
 * drops into a server-action form unchanged. The real <input> is visually
 * hidden and drives the track/thumb through `peer-*` styles, keeping keyboard
 * and screen-reader behaviour native.
 */
export function Switch({ label, description, className, ...props }: Props) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4", className)}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full bg-line transition-colors duration-200",
            "peer-checked:bg-accent peer-disabled:opacity-50",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm",
            "transition-transform duration-200 peer-checked:translate-x-5",
          )}
        />
      </span>
    </label>
  );
}
