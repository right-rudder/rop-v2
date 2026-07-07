"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ArrowUpDown, ChevronUp, ChevronDown, Plane, MapPin } from "lucide-react";
import type { State } from "@/lib/types";

type SortField = "name" | "schools" | "airports";
type SortDir = "asc" | "desc";

export function StatesExplorer({ states }: { states: State[] }) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = states;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.abbreviation.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "schools") cmp = a.schoolCount - b.schoolCount;
      else if (sortField === "airports") cmp = a.airportCount - b.airportCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [states, query, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Default desc for count fields so "Most schools" feels natural
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown size={13} className="opacity-40" />;
    return sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
  }

  const totalSchools = states.reduce((n, s) => n + s.schoolCount, 0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-950 via-blue-950 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Browse Flight Schools by State
          </h1>
          <p className="text-lg opacity-80 mb-8">
            {states.length} states &mdash;{" "}
            {totalSchools.toLocaleString()} schools listed nationwide
          </p>

          {/* Live filter input */}
          <div className="max-w-lg mx-auto relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a state name or abbreviation… (Mi, New, Cal)"
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
        {/* Sort bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Sort by:
          </span>

          {(
            [
              ["name", "Name"],
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
            {filtered.length === states.length
              ? `${states.length} states`
              : `${filtered.length} of ${states.length} states`}
          </span>
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <p className="text-xl font-medium mb-2">
              No states match &ldquo;{query}&rdquo;
            </p>
            <button
              onClick={() => setQuery("")}
              className="text-blue-600 hover:underline text-sm"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* State card grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((state) => (
              <Link
                key={state.id}
                href={`/states/${state.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Abbreviation + name */}
                <div className="mb-3">
                  <span className="block text-2xl font-black text-blue-700 dark:text-blue-400 group-hover:text-blue-600 leading-none mb-1">
                    {state.abbreviation}
                  </span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {state.name}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-1 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Plane size={11} />
                    <span>{state.schoolCount} schools</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin size={11} />
                    <span>{state.airportCount} airports</span>
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
