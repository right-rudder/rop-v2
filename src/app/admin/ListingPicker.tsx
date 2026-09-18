"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { controlClass } from "@/components/ui/Input";
import type { ListingOption } from "@/lib/data";

const MAX_RESULTS = 8;

/** Every word of the query must appear somewhere in the name, place, airport code or owner. */
function match(query: string, options: ListingOption[]): ListingOption[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: ListingOption[] = [];
  for (const option of options) {
    const haystack =
      `${option.name} ${option.location} ${option.airport} ${option.owner ?? ""}`.toLowerCase();
    if (words.every((w) => haystack.includes(w))) {
      results.push(option);
      if (results.length === MAX_RESULTS) break;
    }
  }
  return results;
}

/**
 * Type-ahead over a set of listings. Submits the chosen listing's id as `name`;
 * the action re-reads it, so a stale option is refused, not trusted. The choice
 * lives in the parent form, which needs it to word its confirmation and to
 * clear it once the action has succeeded.
 */
export function ListingPicker({
  id,
  name,
  options,
  value: selected,
  onChange,
  emptyLabel = "No listing matches",
}: {
  id: string;
  name: string;
  options: ListingOption[];
  value: ListingOption | null;
  onChange: (option: ListingOption | null) => void;
  /** Lead-in of the no-results line, e.g. "No unowned listing matches" */
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(
    () => (query.trim().length < 2 ? [] : match(query, options)),
    [query, options],
  );
  const open = !dismissed && !selected && results.length > 0;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDismissed(true);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(option: ListingOption) {
    onChange(option);
    setQuery("");
    setActiveIndex(-1);
  }

  function clear() {
    onChange(null);
    // The input only mounts once the selection is gone
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      // Never submit the form from an open list — Enter picks, like the hero search
      e.preventDefault();
      choose(results[Math.max(activeIndex, 0)]);
    } else if (e.key === "Escape") {
      setDismissed(true);
    }
  }

  if (selected) {
    return (
      <div className={cn(controlClass, "flex items-center justify-between gap-3")}>
        <input type="hidden" name={name} value={selected.id} />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{selected.name}</span>
          <OptionMeta option={selected} />
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label={`Remove ${selected.name}`}
          className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setDismissed(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setDismissed(false)}
        placeholder="School name, city or airport code"
        autoComplete="off"
        className={cn(controlClass, "[&::-webkit-search-cancel-button]:hidden")}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 text-left shadow-card"
        >
          {results.map((option, i) => (
            <li
              key={option.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              // mousedown, not click: it fires before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2.5 transition-colors",
                i === activeIndex ? "bg-surface-2" : "hover:bg-surface-2",
              )}
            >
              <span className="block truncate font-semibold text-ink">{option.name}</span>
              <OptionMeta option={option} />
            </li>
          ))}
        </ul>
      )}

      {!open && !dismissed && query.trim().length >= 2 && (
        <p className="mt-1.5 text-sm text-muted">
          {emptyLabel} “{query.trim()}”.
        </p>
      )}
    </div>
  );
}

function OptionMeta({ option }: { option: ListingOption }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted">
      <MapPin size={12} aria-hidden />
      {option.location}
      <span className="font-mono text-xs text-sky">{option.airport}</span>
      {option.owner && <span className="truncate">· {option.owner}</span>}
    </span>
  );
}
