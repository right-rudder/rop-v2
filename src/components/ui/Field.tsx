import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Label + control + hint/error, laid out consistently across every form. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  action,
  required,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Small link/button rendered on the right of the label row */
  action?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-accent" aria-hidden>*</span>}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
