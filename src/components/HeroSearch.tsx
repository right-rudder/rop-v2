"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Plane } from "lucide-react";
import {
  flightSchools,
  airports,
  getCityBySlug,
  getStateBySlug,
} from "@/lib/mock-data";
import { schoolHref } from "@/lib/utils";

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

function search(q: string): Result[] {
  const needle = q.toLowerCase().trim();
  if (!needle) return [];

  const results: Result[] = [];

  for (const school of flightSchools) {
    const city = getCityBySlug(school.citySlug);
    const state = getStateBySlug(school.stateSlug);
    const location =
      city && state ? `${city.name}, ${state.abbreviation}` : school.citySlug;

    const hit =
      school.name.toLowerCase().includes(needle) ||
      school.primaryAirportCode.toLowerCase().includes(needle) ||
      location.toLowerCase().includes(needle) ||
      (city?.name.toLowerCase().includes(needle) ?? false) ||
      (state?.name.toLowerCase().includes(needle) ?? false) ||
      state?.abbreviation.toLowerCase() === needle;

    if (hit) {
      results.push({
        kind: "school",
        id: school.id,
        name: school.name,
        location,
        href: schoolHref(school),
        airport: school.primaryAirportCode,
      });
    }
  }

  for (const airport of airports) {
    const city = getCityBySlug(airport.citySlug);
    const state = getStateBySlug(airport.stateSlug);
    const location =
      city && state ? `${city.name}, ${state.abbreviation}` : airport.citySlug;

    const hit =
      airport.icao.toLowerCase().includes(needle) ||
      (airport.iata?.toLowerCase().includes(needle) ?? false) ||
      (airport.faaLid?.toLowerCase().includes(needle) ?? false) ||
      airport.name.toLowerCase().includes(needle);

    if (hit) {
      results.push({
        kind: "airport",
        id: airport.id,
        code: airport.icao,
        name: airport.name,
        location,
        href: `/airports/${airport.icao.toLowerCase()}`,
      });
    }
  }

  return results.slice(0, 8);
}

export function HeroSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const hits = search(query);
    setResults(hits);
    setOpen(hits.length > 0);
    setActiveIndex(-1);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto relative">
      <div className="flex rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-white/10 backdrop-blur-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="e.g. Mesa AZ, KFFZ, Arizona Pilot Academy..."
          autoComplete="off"
          className="flex-1 px-6 py-5 text-lg text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-300 bg-transparent"
        />
      </div>

      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          {results.map((result, i) => (
            <li key={result.id}>
              <button
                type="button"
                onMouseDown={() => navigate(result.href)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                  i === activeIndex
                    ? "bg-blue-50 dark:bg-blue-900/40"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                } ${i > 0 ? "border-t border-slate-100 dark:border-slate-700" : ""}`}
              >
                {result.kind === "school" ? (
                  <>
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {result.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.location}
                        <span className="ml-1 text-xs text-slate-400">
                          · {result.airport}
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Plane className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        <span className="text-blue-700 dark:text-blue-400">
                          {result.code}
                        </span>
                        <span className="text-slate-400 mx-1">&nbsp;</span>
                        {result.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.location}
                      </p>
                    </div>
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
