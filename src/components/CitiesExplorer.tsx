"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ArrowUpDown, ChevronUp, ChevronDown, Plane, MapPin } from "lucide-react";

export type CityRow = {
  id: string;
  name: string;
  slug: string;
  stateSlug: string;
  stateAbbreviation: string;
  schoolCount: number;
  airportCount: number;
};

type SortField = "name" | "state" | "schools" | "airports";
type SortDir = "asc" | "desc";

export function CitiesExplorer({ cities }: { cities: CityRow[] }) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = cities;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.stateAbbreviation.toLowerCase().includes(q) ||
          c.stateSlug.replace(/-/g, " ").includes(q),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "state") cmp = a.stateAbbreviation.localeCompare(b.stateAbbreviation);
      else if (sortField === "schools") cmp = a.schoolCount - b.schoolCount;
      else if (sortField === "airports") cmp = a.airportCount - b.airportCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [cities, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" || field === "state" ? "asc" : "desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={13} className="opacity-40" />;
    return sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  }

  const totalSchools = cities.reduce((n, c) => n + c.schoolCount, 0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Browse Flight Schools by City
          </h1>
          <p className="text-lg opacity-80 mb-8">
            {cities.length} cities &mdash;{" "}
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
              placeholder="Search by city or state… (Mesa, AZ, Florida)"
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
              ["name", "City"],
              ["state", "State"],
              ["schools", "Schools"],
              ["airports", "Airports"],
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
            {filtered.length === cities.length
              ? `${cities.length} cities`
              : `${filtered.length} of ${cities.length} cities`}
          </span>
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p className="text-xl font-medium mb-2">
              No cities match &ldquo;{query}&rdquo;
            </p>
            <button onClick={() => setQuery("")} className="text-blue-600 hover:underline text-sm">
              Clear filter
            </button>
          </div>
        )}

        {/* City card grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((city) => (
              <Link
                key={city.id}
                href={`/cities/${city.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="mb-3">
                  <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-tight mb-0.5">
                    {city.name}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {city.stateAbbreviation}
                  </span>
                </div>

                <div className="space-y-1 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Plane size={11} />
                    <span>{city.schoolCount} {city.schoolCount === 1 ? "school" : "schools"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin size={11} />
                    <span>{city.airportCount} {city.airportCount === 1 ? "airport" : "airports"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
