"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ArrowUpDown, ChevronUp, ChevronDown, Plane } from "lucide-react";

export type AirportRow = {
  id: string;
  name: string;
  icao: string;
  iata: string | null;
  faaLid: string | null;
  citySlug: string;
  cityName: string;
  stateSlug: string;
  stateAbbreviation: string;
  schoolCount: number;
};

type SortField = "icao" | "name" | "city" | "schools";
type SortDir = "asc" | "desc";

export function AirportsExplorer({ airports }: { airports: AirportRow[] }) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("icao");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = airports;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.icao.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.cityName.toLowerCase().includes(q) ||
          a.stateAbbreviation.toLowerCase().includes(q) ||
          (a.iata?.toLowerCase().includes(q) ?? false) ||
          (a.faaLid?.toLowerCase().includes(q) ?? false),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "icao") cmp = a.icao.localeCompare(b.icao);
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "city") cmp = a.cityName.localeCompare(b.cityName);
      else if (sortField === "schools") cmp = a.schoolCount - b.schoolCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [airports, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "schools" ? "desc" : "asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={13} className="opacity-40" />;
    return sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  }

  const totalSchools = airports.reduce((n, a) => n + a.schoolCount, 0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Browse Flight Schools by Airport
          </h1>
          <p className="text-lg opacity-80 mb-8">
            {airports.length} airports &mdash;{" "}
            {totalSchools.toLocaleString()} schools listed nationwide
          </p>

          <div className="max-w-lg mx-auto relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ICAO, IATA, FAA, airport name, or city…"
              className="w-full pl-12 pr-10 py-4 rounded-lg bg-slate-800/70 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sort controls + grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sort by:</span>

          {(
            [
              ["icao", "Code"],
              ["name", "Name"],
              ["city", "City"],
              ["schools", "Schools"],
            ] as [SortField, string][]
          ).map(([field, label]) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                sortField === field
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
            >
              {label}
              <SortIcon field={field} />
            </button>
          ))}

          <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            {filtered.length === airports.length
              ? `${airports.length} airports`
              : `${filtered.length} of ${airports.length} airports`}
          </span>
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p className="text-xl font-medium mb-2">
              No airports match &ldquo;{query}&rdquo;
            </p>
            <button onClick={() => setQuery("")} className="text-blue-600 hover:underline text-sm">
              Clear filter
            </button>
          </div>
        )}

        {/* Airport card grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((airport) => (
              <Link
                key={airport.id}
                href={`/airports/${airport.icao.toLowerCase()}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Header row: ICAO + identifier badges */}
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-2xl font-black text-blue-700 dark:text-blue-400 group-hover:text-blue-600 leading-none">
                    {airport.icao}
                  </span>
                  <div className="flex gap-1 text-xs text-slate-400 font-mono">
                    {airport.iata && (
                      <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {airport.iata}
                      </span>
                    )}
                    {airport.faaLid && airport.faaLid !== airport.iata && (
                      <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {airport.faaLid}
                      </span>
                    )}
                  </div>
                </div>

                {/* Airport name */}
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-snug mb-1">
                  {airport.name}
                </p>

                {/* Location + school count */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {airport.cityName}, {airport.stateAbbreviation}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Plane size={11} />
                    {airport.schoolCount} {airport.schoolCount === 1 ? "school" : "schools"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
