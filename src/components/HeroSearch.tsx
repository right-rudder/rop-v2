"use client";

import { useState, useRef, useEffect, useMemo, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, CornerDownLeft } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

export type SchoolSearchItem = {
  id: string;
  name: string;
  location: string;
  href: string;
  airport: string;
  stateName: string;
  stateAbbreviation: string;
};

export type AirportSearchItem = {
  id: string;
  code: string;
  iata: string | null;
  faaLid: string | null;
  name: string;
  location: string;
  href: string;
};

type Result =
  | {
      kind: "school";
      id: string;
      name: string;
      location: string;
      href: string;
      airport: string;
    }
  | {
      kind: "airport";
      id: string;
      code: string;
      name: string;
      location: string;
      href: string;
    };

function search(
  q: string,
  schools: SchoolSearchItem[],
  airports: AirportSearchItem[],
): Result[] {
  const needle = q.toLowerCase().trim();
  if (!needle) return [];

  const results: Result[] = [];

  for (const school of schools) {
    const hit =
      school.name.toLowerCase().includes(needle) ||
      school.airport.toLowerCase().includes(needle) ||
      school.location.toLowerCase().includes(needle) ||
      school.stateName.toLowerCase().includes(needle) ||
      school.stateAbbreviation.toLowerCase() === needle;

    if (hit) {
      results.push({
        kind: "school",
        id: school.id,
        name: school.name,
        location: school.location,
        href: school.href,
        airport: school.airport,
      });
    }
  }

  for (const airport of airports) {
    const hit =
      airport.code.toLowerCase().includes(needle) ||
      (airport.iata?.toLowerCase().includes(needle) ?? false) ||
      (airport.faaLid?.toLowerCase().includes(needle) ?? false) ||
      airport.name.toLowerCase().includes(needle);

    if (hit) {
      results.push({
        kind: "airport",
        id: airport.id,
        code: airport.code,
        name: airport.name,
        location: airport.location,
        href: airport.href,
      });
    }
  }

  return results.slice(0, 8);
}

export function HeroSearch({
  schools,
  airports,
  initialQuery = "",
  examples = [],
  /** Index for the page-load stagger (see .stagger in globals.css) */
  staggerIndex,
}: {
  schools: SchoolSearchItem[];
  airports: AirportSearchItem[];
  initialQuery?: string;
  /** Example queries rendered as chips that fill the box — teaches what search accepts */
  examples?: string[];
  staggerIndex?: number;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(
    () => (query.length < 2 ? [] : search(query, schools, airports)),
    [query, schools, airports],
  );
  const open = !dismissed && results.length > 0;
  const setOpen = (value: boolean) => setDismissed(!value);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
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
      // Enter takes the highlighted result, or the top match when nothing is highlighted
      e.preventDefault();
      navigate(results[Math.max(activeIndex, 0)].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function applyExample(example: string) {
    setQuery(example);
    setDismissed(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  const staggerStyle =
    staggerIndex !== undefined ? ({ "--i": staggerIndex } as CSSProperties) : undefined;

  return (
    <div ref={containerRef} className="relative max-w-2xl">
      <div
        className={cn(
          "flex items-center rounded-2xl border border-line bg-surface shadow-card transition-[border-color,box-shadow] duration-200",
          "focus-within:border-accent focus-within:shadow-accent",
          staggerIndex !== undefined && "animate-fade-up stagger",
        )}
        style={staggerStyle}
      >
        <Search className="ml-5 h-5 w-5 shrink-0 text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDismissed(false);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="School, city, airport code, or state"
          aria-label="Search flight schools"
          autoComplete="off"
          className="flex-1 bg-transparent px-4 py-4 text-base text-ink placeholder:text-muted/70 focus:outline-none md:py-5 md:text-lg [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd
          aria-hidden
          className="mr-4 hidden items-center gap-1 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-muted sm:inline-flex"
        >
          <CornerDownLeft size={10} /> Enter
        </kbd>
      </div>

      {examples.length > 0 && (
        <div
          className={cn(
            "mt-4 flex flex-wrap items-center gap-2",
            staggerIndex !== undefined && "animate-fade-up stagger",
          )}
          style={
            staggerIndex !== undefined
              ? ({ "--i": staggerIndex + 1 } as CSSProperties)
              : undefined
          }
        >
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Try</span>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => applyExample(ex)}
              className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink transition-colors hover:border-accent/50 hover:text-accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 text-left shadow-card"
          style={examples.length > 0 ? { top: "calc(3.5rem + 0.75rem)" } : undefined}
        >
          {results.map((result, i) => (
            <li key={result.id} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={() => navigate(result.href)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  i === activeIndex ? "bg-surface-2" : "hover:bg-surface-2",
                )}
              >
                {result.kind === "school" ? (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                      <Search size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{result.name}</span>
                      <span className="flex items-center gap-1.5 text-sm text-muted">
                        <MapPin size={12} />
                        {result.location}
                        <span className="font-mono text-xs text-sky">{result.airport}</span>
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky">
                      <LogoMark size={14} className="text-sky" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">
                        <span className="mr-2 font-mono text-sky">{result.code}</span>
                        {result.name}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-muted">
                        <MapPin size={12} />
                        {result.location}
                      </span>
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
