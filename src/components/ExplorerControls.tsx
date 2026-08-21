"use client";

import { Search, X, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { controlClass } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/** Live filter box used in explorer heroes. */
export function FilterInput({
  value,
  onChange,
  placeholder,
  label = "Filter",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        size={18}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        className={cn(controlClass, "py-3.5 pl-11 pr-11 shadow-card [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Clear filter"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/** Sort chips + result count row. */
export function SortBar<F extends string>({
  fields,
  sortField,
  sortDir,
  onToggle,
  summary,
}: {
  fields: Array<[F, string]>;
  sortField: F;
  sortDir: "asc" | "desc";
  onToggle: (field: F) => void;
  summary: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-xs uppercase tracking-[0.12em] text-muted">Sort</span>
      {fields.map(([field, label]) => {
        const active = sortField === field;
        return (
          <Chip key={field} active={active} onClick={() => onToggle(field)}>
            {label}
            {active ? (
              sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
            ) : (
              <ArrowUpDown size={13} className="opacity-40" />
            )}
          </Chip>
        );
      })}
      <span className="ml-auto font-mono text-xs uppercase tracking-[0.12em] text-muted">
        {summary}
      </span>
    </div>
  );
}

/** Empty result message for filtered explorers. */
export function NoMatches({ query, onClear, noun }: { query: string; onClear: () => void; noun: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-xl font-bold tracking-tight text-ink">
        No {noun} match &ldquo;{query}&rdquo;
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-sm font-semibold text-accent-ink hover:underline"
      >
        Clear filter
      </button>
    </div>
  );
}
